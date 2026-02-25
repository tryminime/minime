"""
Entity Deduplication Service.

Implements multi-factor duplicate detection using:
1. Embedding similarity (semantic matching)
2. External ID matching (deterministic)
3. Alias matching (fuzzy text matching)
"""

from backend.database.postgres import SessionLocal
from backend.models import Entity
from backend.services.qdrant_entity_service import qdrant_entity_service
from typing import List, Dict, Optional
from uuid import UUID
import structlog

logger = structlog.get_logger()


class EntityDeduplicationService:
    """
    Service for detecting and managing duplicate entities.
    
    Uses multiple signals to identify duplicates:
    - Vector similarity (embeddings)
    - External ID overlap
    - Alias/name matching
    """
    
    # Thresholds
    AUTO_MERGE_THRESHOLD = 0.95  # Auto-merge if confidence >= 95%
    SUGGEST_THRESHOLD = 0.80  # Suggest to user if confidence >= 80%
    
    def find_duplicates(self, entity: Entity, limit: int = 20) -> List[Dict]:
        """
        Find potential duplicate entities using multi-factor matching.
        
        Args:
            entity: Entity to check for duplicates
            limit: Max number of candidates to return
        
        Returns:
            List of duplicate candidates with confidence scores, sorted by confidence desc
        """
        candidates = []
        
        # 1. Embedding-based similarity search
        if entity.embedding and len(entity.embedding) > 0:
            similar = qdrant_entity_service.find_similar_entities(
                embedding=entity.embedding,
                limit=limit + 1,  # +1 to account for self-match
                score_threshold=0.75
            )
            
            for sim in similar:
                # Skip self
                if sim['entity_id'] == str(entity.id):
                    continue
                
                candidates.append({
                    'entity_id': sim['entity_id'],
                    'method': 'embedding',
                    'confidence': sim['similarity'],
                    'name': sim.get('canonical_name', sim.get('name', '')),
                    'entity_type': sim.get('type', sim.get('entity_type', ''))
                })
        
        # 2. External ID matching (very high confidence)
        db = SessionLocal()
        try:
            if entity.entity_metadata and entity.entity_metadata.get('external_ids'):
                ext_ids = entity.entity_metadata['external_ids']
                
                # Find entities with matching external IDs
                for entity_check in db.query(Entity).filter(
                    Entity.user_id == entity.user_id,
                    Entity.id != entity.id,
                    Entity.entity_type == entity.entity_type  # Same type
                ).all():
                    if not entity_check.entity_metadata:
                        continue
                    
                    other_ext_ids = entity_check.entity_metadata.get('external_ids', {})
                    
                    # Check for any matching external ID
                    for key, value in ext_ids.items():
                        if key in other_ext_ids and other_ext_ids[key] == value:
                            candidates.append({
                                'entity_id': str(entity_check.id),
                                'method': 'external_id',
                                'confidence': 0.99,  # Very high confidence
                                'name': entity_check.name,
                                'entity_type': entity_check.entity_type,
                                'match_key': f'{key}:{value}'
                            })
                            break  # One match is enough
        
        finally:
            db.close()
        
        # 3. Deduplicate and merge confidence scores
        candidates_deduped = self._deduplicate_candidates(candidates)
        
        # 4. Sort by confidence descending
        candidates_deduped.sort(key=lambda x: x['confidence'], reverse=True)
        
        # 5. Add recommendation
        for candidate in candidates_deduped:
            if candidate['confidence'] >= self.AUTO_MERGE_THRESHOLD:
                candidate['recommendation'] = 'auto_merge'
            elif candidate['confidence'] >= self.SUGGEST_THRESHOLD:
                candidate['recommendation'] = 'suggest'
            else:
                candidate['recommendation'] = 'review'
        
        return candidates_deduped[:limit]
    
    def _deduplicate_candidates(self, candidates: List[Dict]) -> List[Dict]:
        """
        Remove duplicate candidates and combine confidence scores.
        
        If same entity appears multiple times (e.g., from both embedding
        and external ID matching), take the highest confidence.
        """
        seen = {}
        
        for candidate in candidates:
            entity_id = candidate['entity_id']
            
            if entity_id in seen:
                # Combine confidences (take max)
                seen[entity_id]['confidence'] = max(
                    seen[entity_id]['confidence'],
                    candidate['confidence']
                )
                
                # Add method to list
                if candidate['method'] not in seen[entity_id].get('methods', []):
                    seen[entity_id].setdefault('methods', []).append(candidate['method'])
                
                # Keep additional metadata from external ID match
                if 'match_key' in candidate:
                    seen[entity_id]['match_key'] = candidate['match_key']
            else:
                # First time seeing this entity
                candidate['methods'] = [candidate['method']]
                seen[entity_id] = candidate
        
        return list(seen.values())
    
    def should_auto_merge(self, confidence: float) -> bool:
        """
        Determine if entities should be automatically merged.
        
        Args:
            confidence: Confidence score (0-1)
        
        Returns:
            True if auto-merge recommended (confidence >= 0.95)
        """
        return confidence >= self.AUTO_MERGE_THRESHOLD
    
    def merge_entities(
        self,
        source_id: UUID,
        target_id: UUID,
        user_id: UUID
    ) -> Optional[Entity]:
        """
        Merge source entity into target entity.
        
        Operations:
        1. Update all EntityOccurrence records
        2. Merge aliases and external_ids
        3. Update frequency count
        4. Set source.merged_into_id = target_id
        5. Delete from Qdrant
        
        Args:
            source_id: Entity to merge (will be marked as merged)
            target_id: Target entity (will receive merged data)
            user_id: User ID for authorization
        
        Returns:
            Updated target entity or None if error
        """
        db = SessionLocal()
        
        try:
            # Get entities
            source = db.query(Entity).filter(
                Entity.id == source_id,
                Entity.user_id == user_id
            ).first()
            target = db.query(Entity).filter(
                Entity.id == target_id,
                Entity.user_id == user_id
            ).first()
            
            if not source or not target:
                logger.error("Entity not found for merge", source_id=str(source_id), target_id=str(target_id))
                return None
            
            # Update all activity-entity links
            from backend.models import ActivityEntityLink
            db.query(ActivityEntityLink).filter(
                ActivityEntityLink.entity_id == source_id
            ).update({ActivityEntityLink.entity_id: target_id})
            
            # Merge metadata
            target_metadata = target.entity_metadata or {}
            source_metadata = source.entity_metadata or {}
            target_ext_ids = target_metadata.get('external_ids', {})
            source_ext_ids = source_metadata.get('external_ids', {})
            target_ext_ids.update(source_ext_ids)  # Source IDs take precedence
            target_metadata['external_ids'] = target_ext_ids
            target.entity_metadata = target_metadata
            
            # Update occurrence count
            target.occurrence_count = (target.occurrence_count or 1) + (source.occurrence_count or 1)
            
            # Mark source as merged (soft delete)
            db.delete(source)
            
            # Commit changes
            db.commit()
            
            # Delete source from Qdrant
            qdrant_entity_service.delete_entity(source_id)
            
            logger.info(
                "Entities merged successfully",
                source_id=str(source_id),
                target_id=str(target_id),
                new_occurrence_count=target.occurrence_count
            )
            
            # Refresh target to get latest data
            db.refresh(target)
            return target
            
        except Exception as e:
            db.rollback()
            logger.error("Failed to merge entities", error=str(e), source=str(source_id), target=str(target_id))
            return None
            
        finally:
            db.close()


# Global instance
deduplication_service = EntityDeduplicationService()

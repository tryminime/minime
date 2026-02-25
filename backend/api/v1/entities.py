"""
Entity API endpoints for Week 8 Entity Intelligence.

Handles:
- Entity listing and retrieval
- Duplicate detection
- Entity merging
- Graph neighbor queries
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional, Dict
from uuid import UUID
import structlog

from backend.database.postgres import get_db
from backend.models import Entity, ActivityEntityLink
from backend.auth.jwt_handler import get_current_user
from backend.services.entity_deduplication import deduplication_service

logger = structlog.get_logger()
router = APIRouter()


# =====================================================
# ENTITY LISTING & RETRIEVAL
# =====================================================

@router.get("/entities")
async def list_entities(
    entity_type: Optional[str] = Query(None, alias="type", description="Filter by entity type"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List user's entities with filtering and pagination.
    
    Args:
        entity_type: Optional entity type filter (person, organization, skill, etc.)
        limit: Max number of results (default: 100)
        offset: Pagination offset (default: 0)
    
    Returns:
        List of entities with metadata
    """
    user_id = UUID(current_user["id"]) if isinstance(current_user, dict) else current_user.id
    
    try:
        # Build base query
        stmt = select(Entity).where(Entity.user_id == user_id)
        
        # Apply type filter
        if entity_type:
            stmt = stmt.where(Entity.entity_type == entity_type.lower())
        
        # Get total count
        count_stmt = select(func.count()).select_from(
            stmt.subquery()
        )
        count_result = await db.execute(count_stmt)
        total = count_result.scalar() or 0
        
        # Apply pagination and ordering
        stmt = stmt.order_by(Entity.occurrence_count.desc()).offset(offset).limit(limit)
        result = await db.execute(stmt)
        entities = result.scalars().all()
        
        logger.debug("Entities retrieved", count=len(entities), total=total)
        
        return {
            "entities": [e.to_dict() for e in entities],
            "total": total,
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        logger.error("Failed to retrieve entities", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/entities/{entity_id}")
async def get_entity(
    entity_id: UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get entity by ID with linked activity count.
    
    Returns:
        Entity data with linked activity count
    """
    user_id = UUID(current_user["id"]) if isinstance(current_user, dict) else current_user.id
    
    try:
        # Get entity
        stmt = select(Entity).where(
            Entity.id == entity_id,
            Entity.user_id == user_id
        )
        result = await db.execute(stmt)
        entity = result.scalar_one_or_none()
        
        if not entity:
            raise HTTPException(status_code=404, detail="Entity not found")
        
        # Get linked activity count
        link_count_stmt = select(func.count()).where(
            ActivityEntityLink.entity_id == entity_id
        )
        count_result = await db.execute(link_count_stmt)
        linked_activity_count = count_result.scalar() or 0
        
        # Get recent linked activities
        link_stmt = select(ActivityEntityLink).where(
            ActivityEntityLink.entity_id == entity_id
        ).order_by(ActivityEntityLink.created_at.desc()).limit(5)
        link_result = await db.execute(link_stmt)
        recent_links = link_result.scalars().all()
        
        entity_dict = entity.to_dict()
        entity_dict['linked_activity_count'] = linked_activity_count
        entity_dict['recent_activity_links'] = [link.to_dict() for link in recent_links]
        
        return entity_dict
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get entity", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================
# DUPLICATE DETECTION
# =====================================================

@router.get("/entities/{entity_id}/duplicates")
async def get_entity_duplicates(
    entity_id: UUID,
    threshold: float = Query(0.80, ge=0.0, le=1.0, description="Minimum confidence score"),
    limit: int = Query(20, ge=1, le=100),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get potential duplicate entities using multi-factor matching.
    
    Args:
        entity_id: Entity to check for duplicates
        threshold: Minimum confidence score (0-1, default: 0.80)
        limit: Max number of duplicates to return
    
    Returns:
        List of duplicate candidates with confidence scores and recommendations
    """
    user_id = UUID(current_user["id"]) if isinstance(current_user, dict) else current_user.id
    
    try:
        # Get entity
        stmt = select(Entity).where(
            Entity.id == entity_id,
            Entity.user_id == user_id
        )
        result = await db.execute(stmt)
        entity = result.scalar_one_or_none()
        
        if not entity:
            raise HTTPException(status_code=404, detail="Entity not found")
        
        # Find duplicates
        duplicates = deduplication_service.find_duplicates(entity, limit=limit)
        
        # Filter by threshold
        duplicates_filtered = [d for d in duplicates if d['confidence'] >= threshold]
        
        logger.info(
            "Found duplicate entities",
            entity_id=str(entity_id),
            total=len(duplicates_filtered),
            threshold=threshold
        )
        
        return {
            "entity_id": str(entity_id),
            "entity_name": entity.name,
            "entity_type": entity.entity_type,
            "duplicates": duplicates_filtered,
            "count": len(duplicates_filtered),
            "thresholds": {
                "auto_merge": deduplication_service.AUTO_MERGE_THRESHOLD,
                "suggest": deduplication_service.SUGGEST_THRESHOLD
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to find duplicates", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================
# ENTITY MERGING
# =====================================================

@router.post("/entities/merge")
async def merge_entities(
    source_id: UUID,
    target_id: UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Merge two duplicate entities (Week 8).
    
    Merges source entity into target:
    - Updates all ActivityEntityLink records
    - Merges metadata
    - Updates occurrence count
    - Deletes source entity
    
    Args:
        source_id: Entity to merge (will be removed)
        target_id: Target entity (will receive merged data)
    
    Returns:
        Merged entity data
    """
    user_id = UUID(current_user["id"]) if isinstance(current_user, dict) else current_user.id
    
    try:
        # Perform merge
        merged_entity = deduplication_service.merge_entities(
            source_id=source_id,
            target_id=target_id,
            user_id=user_id
        )
        
        if not merged_entity:
            raise HTTPException(status_code=404, detail="Entity not found or merge failed")
        
        logger.info(
            "Entities merged via API",
            source_id=str(source_id),
            target_id=str(target_id),
            user_id=str(user_id)
        )
        
        return {
            "status": "success",
            "message": "Entities merged successfully",
            "merged_entity": merged_entity.to_dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to merge entities", error=str(e))
        raise HTTPException(status_code=500, detail=f"Merge failed: {str(e)}")


# =====================================================
# GRAPH QUERIES (Placeholder for Neo4j integration)
# =====================================================

@router.get("/entities/{entity_id}/neighbors")
async def get_entity_neighbors(
    entity_id: UUID,
    depth: int = Query(1, ge=1, le=3, description="Traversal depth"),
    relationship_type: Optional[str] = Query(None, description="Filter by relationship type"),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get neighboring entities in the knowledge graph.

    Uses activity_entity_links co-occurrence to find entities that appear
    together in the same activities. Optionally enriched with Qdrant
    semantic similarity for entities without direct co-occurrence links.

    Returns:
        center entity, list of neighbor entities with co-occurrence counts, edges
    """
    user_id = UUID(current_user["id"]) if isinstance(current_user, dict) else current_user.id

    try:
        # Verify entity exists
        stmt = select(Entity).where(
            Entity.id == entity_id,
            Entity.user_id == user_id
        )
        result = await db.execute(stmt)
        entity = result.scalar_one_or_none()

        if not entity:
            raise HTTPException(status_code=404, detail="Entity not found")

        # Get activities where this entity appears
        link_stmt = select(ActivityEntityLink).where(
            ActivityEntityLink.entity_id == entity_id
        )
        link_result = await db.execute(link_stmt)
        links = link_result.scalars().all()

        activity_ids = [link.activity_id for link in links]

        if not activity_ids:
            return {
                "center": entity.to_dict(),
                "neighbors": [],
                "edges": [],
                "count": 0
            }

        # Find other entities linked to the same activities
        co_stmt = select(ActivityEntityLink).where(
            ActivityEntityLink.activity_id.in_(activity_ids),
            ActivityEntityLink.entity_id != entity_id
        )
        co_result = await db.execute(co_stmt)
        co_occurring = co_result.scalars().all()

        # Count co-occurrences per neighbor entity
        neighbor_map: Dict[UUID, int] = {}
        for link in co_occurring:
            neighbor_map[link.entity_id] = neighbor_map.get(link.entity_id, 0) + 1

        # Fetch full entity objects, sorted by co-occurrence count
        neighbors = []
        edges = []
        for neighbor_id, count in sorted(neighbor_map.items(), key=lambda x: x[1], reverse=True)[:20]:
            n_stmt = select(Entity).where(
                Entity.id == neighbor_id,
                Entity.user_id == user_id
            )
            n_result = await db.execute(n_stmt)
            neighbor_entity = n_result.scalar_one_or_none()
            if neighbor_entity:
                neighbors.append({
                    "entity": neighbor_entity.to_dict(),
                    "co_occurrence_count": count,
                    "relationship_type": "CO_OCCURS_WITH"
                })
                edges.append({
                    "source": str(entity_id),
                    "target": str(neighbor_entity.id),
                    "weight": count,
                    "relationship_type": "CO_OCCURS_WITH"
                })

        logger.debug("Found neighbor entities", count=len(neighbors))

        return {
            "center": entity.to_dict(),
            "neighbors": neighbors,
            "edges": edges,
            "count": len(neighbors)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get neighbors", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


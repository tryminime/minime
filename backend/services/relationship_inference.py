"""
Relationship Inference Engine
Automatically infers relationships between entities based on co-occurrence,
citations, and other signals from user's activity data.
"""

from typing import Dict, List, Tuple, Optional, Any, Set
from datetime import datetime, timedelta
from collections import defaultdict, Counter
import logging
import math

from prometheus_client import Counter as PrometheusCounter, Histogram, Gauge

from backend.models.graph_models import NodeType, RelationshipType
from backend.services.graph_ingestion import graph_ingestion_service
from backend.services.relationship_validator import relationship_validator

logger = logging.getLogger(__name__)


# ============================================================================
# PROMETHEUS METRICS
# ============================================================================

inference_relationships_total = PrometheusCounter(
    'inference_relationships_total',
    'Total inferred relationships',
    ['relationship_type', 'inference_method']
)

inference_confidence_distribution = Histogram(
    'inference_confidence_distribution',
    'Distribution of inference confidence scores',
    ['relationship_type'],
    buckets=[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
)

inference_execution_time = Histogram(
    'inference_execution_time_seconds',
    'Time to execute inference',
    ['inference_method']
)

inference_candidates_evaluated = PrometheusCounter(
    'inference_candidates_evaluated_total',
    'Total relationship candidates evaluated',
    ['entity_type_pair']
)


# ============================================================================
# ENTITY TYPE PAIR TO RELATIONSHIP MAPPING
# ============================================================================

ENTITY_PAIR_TO_RELATIONSHIP = {
    # Co-occurrence patterns
    (NodeType.PERSON, NodeType.PERSON): [
        (RelationshipType.COLLABORATES_WITH, "co_occurrence")
    ],
    (NodeType.PERSON, NodeType.PAPER): [
        (RelationshipType.AUTHORED, "co_occurrence"),
        (RelationshipType.WORKS_ON, "co_occurrence")  # If paper topic matches person's work
    ],
    (NodeType.PERSON, NodeType.TOPIC): [
        (RelationshipType.WORKS_ON, "co_occurrence")
    ],
    (NodeType.PERSON, NodeType.PROJECT): [
        (RelationshipType.WORKS_ON, "co_occurrence"),
        (RelationshipType.CONTRIBUTES_TO, "co_occurrence")
    ],
    (NodeType.PERSON, NodeType.INSTITUTION): [
        (RelationshipType.AFFILIATED_WITH, "co_occurrence")
    ],
    (NodeType.PAPER, NodeType.PAPER): [
        (RelationshipType.CITES, "citation"),
        (RelationshipType.RELATED_TO, "co_occurrence")
    ],
    (NodeType.PAPER, NodeType.TOPIC): [
        (RelationshipType.ON_TOPIC, "co_occurrence")
    ],
    (NodeType.PAPER, NodeType.DATASET): [
        (RelationshipType.USES, "mention")
    ],
    (NodeType.PAPER, NodeType.TOOL): [
        (RelationshipType.USES, "mention")
    ],
    (NodeType.PAPER, NodeType.VENUE): [
        (RelationshipType.PUBLISHED_AT, "co_occurrence")
    ],
    (NodeType.PROJECT, NodeType.TOPIC): [
        (RelationshipType.ON_TOPIC, "co_occurrence")
    ],
    (NodeType.PROJECT, NodeType.DATASET): [
        (RelationshipType.USES, "mention")
    ],
    (NodeType.PROJECT, NodeType.TOOL): [
        (RelationshipType.USES, "mention")
    ],
    (NodeType.TOPIC, NodeType.TOPIC): [
        (RelationshipType.RELATED_TO, "co_occurrence")
    ],
    (NodeType.TOOL, NodeType.TOOL): [
        (RelationshipType.DEPENDS_ON, "mention")
    ],
}


class RelationshipInferenceService:
    """
    Service for inferring relationships between entities based on various signals.
    """
    
    def __init__(
        self,
        min_confidence: float = 0.5,
        recency_decay_days: int = 365,
        min_co_occurrences: int = 2
    ):
        """
        Initialize relationship inference service.
        
        Args:
            min_confidence: Minimum confidence threshold for inferred relationships
            recency_decay_days: Days for recency decay (half-life)
            min_co_occurrences: Minimum co-occurrences to consider
        """
        self.logger = logging.getLogger(__name__)
        self.min_confidence = min_confidence
        self.recency_decay_days = recency_decay_days
        self.min_co_occurrences = min_co_occurrences
    
    def infer_relationships_from_co_occurrence(
        self,
        user_id: str,
        entities: List[Dict[str, Any]],
        context: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """
        Infer relationships based on entity co-occurrence in documents/activities.
        
        Args:
            user_id: User ID for multi-tenancy
            entities: List of entities that co-occur (in same document, activity, etc.)
            context: Additional context (timestamp, document type, etc.)
            
        Returns:
            List of inferred relationships with confidence scores
        """
        inferred = []
        context = context or {}
        timestamp = context.get("timestamp", datetime.utcnow())
        
        # Detect all entity pairs
        for i in range(len(entities)):
            for j in range(i + 1, len(entities)):
                entity_a = entities[i]
                entity_b = entities[j]
                
                # Get entity types
                type_a = NodeType(entity_a["type"])
                type_b = NodeType(entity_b["type"])
                
                # Check both directions for valid relationship mappings
                candidates = []
                
                # A -> B
                if (type_a, type_b) in ENTITY_PAIR_TO_RELATIONSHIP:
                    for rel_type, method in ENTITY_PAIR_TO_RELATIONSHIP[(type_a, type_b)]:
                        candidates.append({
                            "from_id": entity_a["id"],
                            "from_type": type_a,
                            "to_id": entity_b["id"],
                            "to_type": type_b,
                            "rel_type": rel_type,
                            "method": method
                        })
                
                # B -> A (reverse direction)
                if (type_b, type_a) in ENTITY_PAIR_TO_RELATIONSHIP:
                    for rel_type, method in ENTITY_PAIR_TO_RELATIONSHIP[(type_b, type_a)]:
                        candidates.append({
                            "from_id": entity_b["id"],
                            "from_type": type_b,
                            "to_id": entity_a["id"],
                            "to_type": type_a,
                            "rel_type": rel_type,
                            "method": method
                        })
                
                # Compute weight and confidence for each candidate
                for candidate in candidates:
                    inference_candidates_evaluated.labels(
                        entity_type_pair=f"{candidate['from_type'].value}-{candidate['to_type'].value}"
                    ).inc()
                    
                    # Compute weight with recency decay
                    weight = self._compute_weight(
                        co_occurrence_count=context.get("frequency", 1),
                        timestamp=timestamp,
                        context_strength=context.get("context_strength", 1.0)
                    )
                    
                    # Compute confidence based on method and signals
                    confidence = self._compute_confidence(
                        method=candidate["method"],
                        weight=weight,
                        entity_a=entity_a,
                        entity_b=entity_b,
                        context=context
                    )
                    
                    # Only include if above threshold
                    if confidence >= self.min_confidence:
                        inferred.append({
                            "from_id": candidate["from_id"],
                            "from_type": candidate["from_type"].value,
                            "to_id": candidate["to_id"],
                            "to_type": candidate["to_type"].value,
                            "rel_type": candidate["rel_type"].value,
                            "weight": weight,
                            "confidence": confidence,
                            "source": ["inference"],
                            "inference_method": candidate["method"],
                            "inferred": True,
                            "timestamp": timestamp.isoformat()
                        })
                        
                        # Track metrics
                        inference_relationships_total.labels(
                            relationship_type=candidate["rel_type"].value,
                            inference_method=candidate["method"]
                        ).inc()
                        
                        inference_confidence_distribution.labels(
                            relationship_type=candidate["rel_type"].value
                        ).observe(confidence)
        
        return inferred
    
    def _compute_weight(
        self,
        co_occurrence_count: int,
        timestamp: datetime,
        context_strength: float = 1.0
    ) -> float:
        """
        Compute relationship weight with frequency and recency factors.
        
        Weight formula:
        weight = frequency_weight * recency_decay * context_strength
        
        Args:
            co_occurrence_count: Number of times entities co-occurred
            timestamp: When the co-occurrence happened
            context_strength: Strength of context (0.0-1.0)
            
        Returns:
            Computed weight
        """
        # Frequency weighting (logarithmic scale)
        # 1 occurrence = 1.0, 10 occurrences = 2.0, 100 occurrences = 3.0
        frequency_weight = 1.0 + math.log10(max(1, co_occurrence_count))
        
        # Recency decay (exponential decay with half-life)
        # More recent co-occurrences get higher weight
        days_old = (datetime.utcnow() - timestamp).days
        half_life = self.recency_decay_days
        recency_decay = math.exp(-0.693 * days_old / half_life)  # 0.693 = ln(2)
        
        # Combined weight
        weight = frequency_weight * recency_decay * context_strength
        
        # Clamp to reasonable range
        return max(0.1, min(5.0, weight))
    
    def _compute_confidence(
        self,
        method: str,
        weight: float,
        entity_a: Dict[str, Any],
        entity_b: Dict[str, Any],
        context: Dict[str, Any]
    ) -> float:
        """
        Compute confidence score for inferred relationship.
        
        Args:
            method: Inference method (co_occurrence, citation, mention)
            weight: Computed weight
            entity_a: First entity
            entity_b: Second entity
            context: Inference context
            
        Returns:
            Confidence score (0.0-1.0)
        """
        # Base confidence by method
        base_confidence = {
            "co_occurrence": 0.6,
            "citation": 0.8,      # Citations are more reliable
            "mention": 0.7        # Explicit mentions are reliable
        }.get(method, 0.5)
        
        # Boost based on weight (higher weight = more confidence)
        weight_boost = min(0.2, weight * 0.05)  # Cap at +0.2
        
        # Boost if entities are well-established (have metadata)
        entity_quality_boost = 0.0
        if entity_a.get("metadata") and entity_b.get("metadata"):
            entity_quality_boost = 0.1
        
        # Boost based on context signals
        context_boost = 0.0
        if context.get("verified"):
            context_boost += 0.15
        if context.get("user_action"):  # User explicitly interacted
            context_boost += 0.1
        
        # Combined confidence
        confidence = base_confidence + weight_boost + entity_quality_boost + context_boost
        
        # Clamp to [0.0, 1.0]
        return max(0.0, min(1.0, confidence))
    
    def infer_citations_from_paper_content(
        self,
        paper_id: str,
        paper_content: str,
        known_papers: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Infer CITES relationships by finding paper mentions in content.
        
        Args:
            paper_id: ID of the citing paper
            paper_content: Full text or abstract of paper
            known_papers: List of known papers to search for
            
        Returns:
            List of inferred citation relationships
        """
        inferred_citations = []
        content_lower = paper_content.lower()
        
        for cited_paper in known_papers:
            # Skip self-citations
            if cited_paper["id"] == paper_id:
                continue
            
            # Check for mentions of paper title, authors, or DOI
            mentioned = False
            mention_signals = []
            
            # Title mention
            if cited_paper.get("title"):
                title_lower = cited_paper["title"].lower()
                if title_lower in content_lower:
                    mentioned = True
                    mention_signals.append("title")
            
            # Author mention (check if any author appears)
            if cited_paper.get("authors"):
                for author in cited_paper["authors"]:
                    author_lower = author.lower()
                    if author_lower in content_lower:
                        mentioned = True
                        mention_signals.append("author")
                        break
            
            # DOI mention
            if cited_paper.get("doi"):
                if cited_paper["doi"] in paper_content:
                    mentioned = True
                    mention_signals.append("doi")
            
            if mentioned:
                # Higher confidence if multiple signals
                base_confidence = 0.7
                if len(mention_signals) > 1:
                    base_confidence = 0.85
                if "doi" in mention_signals:
                    base_confidence = 0.95  # DOI is very specific
                
                inferred_citations.append({
                    "from_id": paper_id,
                    "from_type": "PAPER",
                    "to_id": cited_paper["id"],
                    "to_type": "PAPER",
                    "rel_type": "CITES",
                    "weight": 1.0,
                    "confidence": base_confidence,
                    "source": ["inference"],
                    "inference_method": "mention",
                    "mention_signals": mention_signals,
                    "inferred": True
                })
                
                inference_relationships_total.labels(
                    relationship_type="CITES",
                    inference_method="mention"
                ).inc()
        
        return inferred_citations
    
    def infer_tool_usage_from_text(
        self,
        entity_id: str,
        entity_type: str,
        text_content: str,
        known_tools: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Infer USES relationships by detecting tool/dataset mentions in text.
        
        Args:
            entity_id: ID of entity (PAPER or PROJECT)
            entity_type: Type of entity
            text_content: Text content to analyze
            known_tools: List of known tools/datasets
            
        Returns:
            List of inferred USES relationships
        """
        inferred_uses = []
        content_lower = text_content.lower()
        
        for tool in known_tools:
            tool_name = tool.get("canonical_name", tool.get("name", "")).lower()
            
            if not tool_name:
                continue
            
            # Check for exact or fuzzy matches
            if tool_name in content_lower:
                # Determine if primary or secondary usage
                is_primary = False
                if any(keyword in content_lower for keyword in [
                    f"primarily {tool_name}",
                    f"mainly {tool_name}",
                    f"using {tool_name}",
                    f"built with {tool_name}"
                ]):
                    is_primary = True
                
                weight = 2.0 if is_primary else 1.0
                confidence = 0.75  # Mention-based inference
                
                inferred_uses.append({
                    "from_id": entity_id,
                    "from_type": entity_type,
                    "to_id": tool["id"],
                    "to_type": tool["type"],
                    "rel_type": "USES",
                    "weight": weight,
                    "confidence": confidence,
                    "source": ["inference"],
                    "inference_method": "mention",
                    "primary": is_primary,
                    "inferred": True
                })
                
                inference_relationships_total.labels(
                    relationship_type="USES",
                    inference_method="mention"
                ).inc()
        
        return inferred_uses
    
    def batch_infer_from_activity_log(
        self,
        user_id: str,
        activity_log: List[Dict[str, Any]],
        lookback_days: int = 90
    ) -> Dict[str, Any]:
        """
        Batch infer relationships from user activity log.
        
        Analyzes activity patterns to find entity co-occurrences and infer relationships.
        
        Args:
            user_id: User ID
            activity_log: List of user activities with entity mentions
            lookback_days: How far back to analyze
            
        Returns:
            Summary of inferred relationships
        """
        import time
        start_time = time.time()
        
        # Track co-occurrences
        co_occurrence_tracker = defaultdict(lambda: {
            "count": 0,
            "timestamps": [],
            "contexts": []
        })
        
        # Filter recent activities
        cutoff_date = datetime.utcnow() - timedelta(days=lookback_days)
        recent_activities = [
            act for act in activity_log
            if datetime.fromisoformat(act.get("timestamp", "2000-01-01")) > cutoff_date
        ]
        
        # Extract co-occurrences from each activity
        for activity in recent_activities:
            entities = activity.get("entities", [])
            timestamp = datetime.fromisoformat(activity.get("timestamp", datetime.utcnow().isoformat()))
            
            # Record all entity pairs in this activity
            for i in range(len(entities)):
                for j in range(i + 1, len(entities)):
                    entity_a_id = entities[i]["id"]
                    entity_b_id = entities[j]["id"]
                    
                    # Create canonical pair key (sorted)
                    pair_key = tuple(sorted([entity_a_id, entity_b_id]))
                    
                    co_occurrence_tracker[pair_key]["count"] += 1
                    co_occurrence_tracker[pair_key]["timestamps"].append(timestamp)
                    co_occurrence_tracker[pair_key]["contexts"].append({
                        "activity_type": activity.get("type"),
                        "context_strength": activity.get("importance", 1.0)
                    })
        
        # Infer relationships from co-occurrences
        all_inferred = []
        
        for pair_key, occurrence_data in co_occurrence_tracker.items():
            # Skip if below minimum threshold
            if occurrence_data["count"] < self.min_co_occurrences:
                continue
            
            # Get most recent timestamp
            most_recent = max(occurrence_data["timestamps"])
            
            # Average context strength
            avg_context_strength = sum(
                ctx.get("context_strength", 1.0)
                for ctx in occurrence_data["contexts"]
            ) / len(occurrence_data["contexts"])
            
            # Create entities list for inference
            # Note: Would need to fetch full entity data in real implementation
            entities = [
                {"id": pair_key[0], "type": "PERSON"},  # Placeholder
                {"id": pair_key[1], "type": "PAPER"}    # Placeholder
            ]
            
            context = {
                "frequency": occurrence_data["count"],
                "timestamp": most_recent,
                "context_strength": avg_context_strength,
                "user_action": True
            }
            
            # Infer relationships
            inferred = self.infer_relationships_from_co_occurrence(
                user_id=user_id,
                entities=entities,
                context=context
            )
            
            all_inferred.extend(inferred)
        
        elapsed = time.time() - start_time
        
        inference_execution_time.labels(
            inference_method='batch_activity_log'
        ).observe(elapsed)
        
        return {
            "inferred_count": len(all_inferred),
            "co_occurrence_pairs": len(co_occurrence_tracker),
            "activities_analyzed": len(recent_activities),
            "execution_time_sec": elapsed,
            "relationships": all_inferred
        }
    
    def apply_confidence_thresholds(
        self,
        inferred_relationships: List[Dict[str, Any]],
        thresholds: Dict[str, float] = None
    ) -> List[Dict[str, Any]]:
        """
        Filter inferred relationships by confidence thresholds.
        
        Args:
            inferred_relationships: List of inferred relationships
            thresholds: Custom thresholds per relationship type
            
        Returns:
            Filtered relationships above threshold
        """
        if thresholds is None:
            # Default thresholds
            thresholds = {
                "AUTHORED": 0.7,
                "CITES": 0.6,
                "COLLABORATES_WITH": 0.65,
                "USES": 0.6,
                "WORKS_ON": 0.6,
                "ON_TOPIC": 0.55,
                "RELATED_TO": 0.5,
                "default": self.min_confidence
            }
        
        filtered = []
        for rel in inferred_relationships:
            rel_type = rel["rel_type"]
            threshold = thresholds.get(rel_type, thresholds["default"])
            
            if rel["confidence"] >= threshold:
                filtered.append(rel)
        
        self.logger.info(
            f"Applied confidence thresholds: {len(inferred_relationships)} -> {len(filtered)} relationships"
        )
        
        return filtered


# Global service instance
relationship_inference_service = RelationshipInferenceService()

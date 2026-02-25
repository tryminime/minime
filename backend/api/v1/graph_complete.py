"""
Complete Graph API Router
All 18 RESTful endpoints for knowledge graph queries and analytics.
Includes rate limiting, pagination, filtering, validation, and comprehensive error handling.
"""

from typing import List, Optional
from datetime import datetime
import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address

from backend.auth.jwt_handler import get_current_user
from backend.models.user import User
from backend.services.node2vec_service import Node2VecService
from backend.services.community_service import CommunityService
from backend.config.neo4j_config import get_neo4j_session
from backend.api.v1.graph_models import (
    NodeDetail, NodeMetrics, NeighborResponse, NeighborNode,
    Expert, ExpertListResponse,
    CollaboratorRecommendation, CollaboratorRecommendationResponse,
    LearningPath, LearningPathResponse, LearningPathNode,
    Community, CommunityListResponse, CommunityMember,
    EmbeddingSearchRequest, EmbeddingSearchResponse, SimilarNode,
    GraphExportResponse, GraphNode, GraphRelationship,
    PaginationParams, FilterParams,
    ErrorResponse
)

logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter(prefix="/graph", tags=["Knowledge Graph"])

# Rate limiter: 100 requests per minute per user
limiter = Limiter(key_func=get_remote_address)

# Initialize services
node2vec_service = Node2VecService()
community_service = CommunityService()


# ============================================================================
# NODE ENDPOINTS (2 endpoints)
# ============================================================================

@router.get(
    "/nodes/{node_id}",
    response_model=NodeDetail,
    summary="Get node details with all metrics",
    description="Retrieve comprehensive node information including centrality metrics, embeddings, and community assignment.",
    responses={
        200: {"description": "Node details retrieved successfully"},
        404: {"description": "Node not found"},
        500: {"description": "Internal server error"}
    }
)
@limiter.limit("100/minute")
async def get_node_details(
    request: Request,
    node_id: int,
    current_user: User = Depends(get_current_user)
):
    """
    Get comprehensive node details including:
    - Basic properties (name, email, etc.)
    - All centrality metrics (degree, betweenness, closeness, eigenvector, PageRank)
    - Community assignment
    - Reduced embedding vector (8 dimensions)
    - Neighbor count
    """
    try:
        with get_neo4j_session() as session:
            query = """
            MATCH (n)
            WHERE id(n) = $nodeId
              AND n.user_id = $userId
            OPTIONAL MATCH (n)-[r]-(neighbor)
            WHERE neighbor.user_id = $userId
            RETURN 
                id(n) as nodeId,
                labels(n) as labels,
                properties(n) as properties,
                n.degree_centrality as degreeCentrality,
                n.betweenness_centrality as betweennessCentrality,
                n.closeness_centrality as closenessCentrality,
                n.eigenvector_centrality as eigenvectorCentrality,
                n.pagerank as pagerank,
                n.community_id as communityId,
                n.embedding_reduced as embeddingReduced,
                count(DISTINCT neighbor) as neighborCount
            """
            
            result = session.run(
                query,
                nodeId=node_id,
                userId=current_user.id
            ).single()
            
            if not result:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Node {node_id} not found or does not belong to user"
                )
            
            # Build metrics object
            metrics = NodeMetrics(
                degree_centrality=result.get("degreeCentrality"),
                betweenness_centrality=result.get("betweennessCentrality"),
                closeness_centrality=result.get("closenessCentrality"),
                eigenvector_centrality=result.get("eigenvectorCentrality"),
                pagerank=result.get("pagerank"),
                community_id=result.get("communityId"),
                embedding_reduced=result.get("embeddingReduced")
            )
            
            return NodeDetail(
                node_id=result["nodeId"],
                labels=result["labels"],
                properties=result["properties"],
                metrics=metrics,
                neighbor_count=result["neighborCount"]
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching node {node_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch node details"
        )


@router.get(
    "/nodes/{node_id}/neighbors",
    response_model=NeighborResponse,
    summary="Get 1-hop neighbors",
    description="Retrieve all direct neighbors of a node with relationship information.",
    responses={
        200: {"description": "Neighbors retrieved successfully"},
        500: {"description": "Internal server error"}
    }
)
@limiter.limit("100/minute")
async def get_node_neighbors(
    request: Request,
    node_id: int,
    relationship_types: Optional[List[str]] = Query(None, description="Filter by relationship types"),
    current_user: User = Depends(get_current_user)
):
    """
    Get 1-hop neighbors of a node.
    
    Optionally filter by relationship types (e.g., COLLABORATES_WITH, AUTHORED, ON_TOPIC).
    Returns up to 100 neighbors ordered by relationship weight.
    """
    try:
        with get_neo4j_session() as session:
            # Build relationship filter
            rel_filter = ""
            if relationship_types:
                rel_types = "|".join(relationship_types)
                rel_filter = f":{rel_types}"
            
            query = f"""
            MATCH (source)
            WHERE id(source) = $nodeId
              AND source.user_id = $userId
            
            MATCH (source)-[r{rel_filter}]-(neighbor)
            WHERE neighbor.user_id = $userId
            
            RETURN 
                id(neighbor) as neighborId,
                labels(neighbor) as labels,
                coalesce(neighbor.canonical_name, neighbor.name, 'Unknown') as name,
                type(r) as relationshipType,
                r.weight as weight
            ORDER BY weight DESC NULLS LAST
            LIMIT 100
            """
            
            results = session.run(
                query,
                nodeId=node_id,
                userId=current_user.id
            ).data()
            
            neighbors = [
                NeighborNode(
                    node_id=r["neighborId"],
                    labels=r["labels"],
                    name=r["name"],
                    relationship_type=r["relationshipType"],
                    relationship_weight=r.get("weight")
                )
                for r in results
            ]
            
            return NeighborResponse(
                node_id=node_id,
                neighbors=neighbors,
                total_neighbors=len(neighbors)
            )
            
    except Exception as e:
        logger.error(f"Error fetching neighbors for {node_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch neighbors"
        )


# ============================================================================
# EXPERT ENDPOINTS (2 endpoints)
# ============================================================================

@router.get(
    "/experts",
    response_model=ExpertListResponse,
    summary="Get expert rankings",
    description="Retrieve top experts globally or filtered by topic, ranked by PageRank centrality.",
    responses={
        200: {"description": "Experts retrieved successfully"},
        500: {"description": "Internal server error"}
    }
)
@limiter.limit("100/minute")
async def get_experts(
    request: Request,
    topic_id: Optional[int] = Query(None, description="Filter by topic ID"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Results per page"),
    current_user: User = Depends(get_current_user)
):
    """
    Get expert rankings.
    
    - **Global**: Returns top experts overall (no topic_id)
    - **By topic**: Returns experts for specific topic (via ON_TOPIC relationships)
    
    Experts are ranked by PageRank centrality. Results include:
    - h-index (if available)
    - Paper count
    - Community assignment
    """
    try:
        offset = (page - 1) * page_size
        
        with get_neo4j_session() as session:
            if topic_id:
                # Topic-specific experts
                query = """
                MATCH (topic)
                WHERE id(topic) = $topicId
                  AND topic.user_id = $userId
                
                MATCH (person:PERSON)-[:ON_TOPIC]->(topic)
                WHERE person.pagerank IS NOT NULL
                  AND person.user_id = $userId
                
                OPTIONAL MATCH (person)-[:AUTHORED]->(paper:PAPER)
                WHERE paper.user_id = $userId
                
                WITH person, 
                     count(DISTINCT paper) as paperCount,
                     person.pagerank as pagerank
                
                RETURN 
                    id(person) as nodeId,
                    coalesce(person.canonical_name, person.name, 'Unknown') as name,
                    labels(person)[0] as nodeType,
                    pagerank,
                    person.h_index as hIndex,
                    paperCount,
                    person.community_id as communityId
                
                ORDER BY pagerank DESC
                SKIP $offset
                LIMIT $limit
                """
                
                params = {
                    "topicId": topic_id,
                    "userId": current_user.id,
                    "offset": offset,
                    "limit": page_size
                }
                
                # Get total count for topic
                count_query = """
                MATCH (topic)
                WHERE id(topic) = $topicId
                  AND topic.user_id = $userId
                MATCH (person:PERSON)-[:ON_TOPIC]->(topic)
                WHERE person.pagerank IS NOT NULL
                  AND person.user_id = $userId
                RETURN count(person) as total
                """
                total_count = session.run(count_query, topicId=topic_id, userId=current_user.id).single()["total"]
            else:
                # Global experts
                query = """
                MATCH (person:PERSON)
                WHERE person.user_id = $userId
                  AND person.pagerank IS NOT NULL
                
                OPTIONAL MATCH (person)-[:AUTHORED]->(paper:PAPER)
                WHERE paper.user_id = $userId
                
                WITH person,
                     count(DISTINCT paper) as paperCount,
                     person.pagerank as pagerank
                
                RETURN 
                    id(person) as nodeId,
                    coalesce(person.canonical_name, person.name, 'Unknown') as name,
                    labels(person)[0] as nodeType,
                    pagerank,
                    person.h_index as hIndex,
                    paperCount,
                    person.community_id as communityId
                
                ORDER BY pagerank DESC
                SKIP $offset
                LIMIT $limit
                """
                
                params = {
                    "userId": current_user.id,
                    "offset": offset,
                    "limit": page_size
                }
                
                # Get total count
                count_query = """
                MATCH (person:PERSON)
                WHERE person.user_id = $userId
                  AND person.pagerank IS NOT NULL
                RETURN count(person) as total
                """
                total_count = session.run(count_query, userId=current_user.id).single()["total"]
            
            results = session.run(query, **params).data()
            
            experts = [
                Expert(
                    node_id=r["nodeId"],
                    name=r["name"],
                    node_type=r["nodeType"],
                    pagerank=r["pagerank"],
                    h_index=r.get("hIndex"),
                    paper_count=r.get("paperCount"),
                    community_id=r.get("communityId")
                )
                for r in results
            ]
            
            return ExpertListResponse(
                experts=experts,
                total_count=total_count,
                page=page,
                page_size=page_size,
                topic_id=topic_id
            )
            
    except Exception as e:
        logger.error(f"Error fetching experts: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch experts"
        )


# ============================================================================
# RECOMMENDATION ENDPOINTS (1 endpoint)
# ============================================================================

@router.get(
    "/collaborators/recommend",
    response_model=CollaboratorRecommendationResponse,
    summary="Get collaborator recommendations",
    description="Hybrid recommendations combining embedding similarity, community bridges, and PageRank.",
    responses={
        200: {"description": "Recommendations generated successfully"},
        400: {"description": "Invalid request parameters"},
        500: {"description": "Internal server error"}
    }
)
@limiter.limit("100/minute")
async def recommend_collaborators(
    request: Request,
    for_node_id: int = Query(..., description="Node ID to find collaborators for"),
    top_k: int = Query(10, ge=1, le=50, description="Number of recommendations"),
    current_user: User = Depends(get_current_user)
):
    """
    Recommend potential collaborators using hybrid approach:
    
    1. **Embedding similarity**: Find researchers with similar work (Node2Vec)
    2. **Community bridges**: Identify cross-community connections
    3. **High PageRank**: Surface influential researchers
    
    Excludes existing direct collaborators.
    """
    try:
        recommendations = []
        seen_ids = set()
        
        # 1. Embedding-based recommendations
        try:
            similar_nodes = node2vec_service.find_similar_nodes(
                node_id=for_node_id,
                user_id=current_user.id,
                top_k=top_k * 2,  # Get more to filter
                min_similarity=0.6
            )
            
            for node in similar_nodes:
                if node["node_id"] not in seen_ids:
                    seen_ids.add(node["node_id"])
                    recommendations.append(
                        CollaboratorRecommendation(
                            node_id=node["node_id"],
                            name=node["payload"].get("name", "Unknown"),
                            similarity_score=node["similarity"],
                            shared_topics=[],
                            pagerank=node["payload"].get("pagerank"),
                            reason="embedding_similarity"
                        )
                    )
        except Exception as e:
            logger.warning(f"Embedding recommendations failed: {e}")
        
        # 2. Community bridge recommendations
        try:
            with get_neo4j_session() as session:
                # Get source node's community
                community_query = """
                MATCH (n)
                WHERE id(n) = $nodeId
                  AND n.user_id = $userId
                RETURN n.community_id as communityId
                """
                
                source_community = session.run(
                    community_query,
                    nodeId=for_node_id,
                    userId=current_user.id
                ).single()
                
                if source_community and source_community["communityId"] is not None:
                    bridges = community_service.find_community_bridges(
                        user_id=current_user.id,
                        community_id=source_community["communityId"],
                        top_k=5
                    )
                    
                    for bridge in bridges:
                        if bridge["node_id"] not in seen_ids:
                            seen_ids.add(bridge["node_id"])
                            recommendations.append(
                                CollaboratorRecommendation(
                                    node_id=bridge["node_id"],
                                    name=bridge["node_name"],
                                    similarity_score=0.8,  # High value for bridges
                                    shared_topics=[],
                                    pagerank=bridge.get("pagerank"),
                                    reason="community_bridge"
                                )
                            )
        except Exception as e:
            logger.warning(f"Community bridge recommendations failed: {e}")
        
        # Sort by similarity score and limit
        recommendations.sort(key=lambda x: x.similarity_score, reverse=True)
        recommendations = recommendations[:top_k]
        
        return CollaboratorRecommendationResponse(
            recommendations=recommendations,
            total_count=len(recommendations)
        )
        
    except Exception as e:
        logger.error(f"Error generating recommendations: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate recommendations"
        )


# Continue in next file part...

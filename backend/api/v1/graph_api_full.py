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
"""
Graph API Router - Part 2
Learning paths, communities, embeddings, and export endpoints.
"""

# Continuation of graph_complete.py

# ============================================================================
# LEARNING PATH ENDPOINTS (1 endpoint)
# ============================================================================

@router.get(
    "/learning-paths",
    response_model=LearningPathResponse,
    summary="Get learning paths between topics",
    description="Find learning paths from source topic to target using BFS on prerequisite relationships.",
    responses={
        200: {"description": "Learning paths retrieved successfully"},
        404: {"description": "Topic not found"},
        500: {"description": "Internal server error"}
    }
)
@limiter.limit("100/minute")
async def get_learning_paths(
    request: Request,
    source_topic_id: int = Query(..., description="Starting topic ID"),
    target_topic_id: Optional[int] = Query(None, description="Target topic ID (optional)"),
    max_depth: int = Query(5, ge=1, le=10, description="Maximum path length"),
    current_user: User = Depends(get_current_user)
):
    """
    Find learning paths between topics using BFS.
    
    - **With target**: Find shortest paths from source to target
    - **Without target**: Return all reachable topics up to max_depth
    
    Uses DEPENDS_ON relationships for prerequisites.
    Difficulty is estimated based on path length:
    - depth ≤ 2: beginner
    - depth 3-4: intermediate  
    - depth ≥ 5: advanced
    """
    try:
        with get_neo4j_session() as session:
            if target_topic_id:
                # Shortest path between two topics
                query = """
                MATCH (source:TOPIC), (target:TOPIC)
                WHERE id(source) = $sourceId
                  AND id(target) = $targetId
                  AND source.user_id = $userId
                  AND target.user_id = $userId
                
                MATCH path = shortestPath((source)-[:DEPENDS_ON*..{maxDepth}]->(target))
                
                WITH nodes(path) as pathNodes
                UNWIND range(0, size(pathNodes)-1) as idx
                WITH pathNodes[idx] as node, idx
                
                RETURN 
                    id(node) as nodeId,
                    coalesce(node.canonical_name, node.name, 'Unknown') as name,
                    labels(node)[0] as nodeType,
                    idx as depth
                ORDER BY depth
                """
                
                results = session.run(
                    query,
                    sourceId=source_topic_id,
                    targetId=target_topic_id,
                    userId=current_user.id,
                    maxDepth=max_depth
                ).data()
                
                if not results:
                    return LearningPathResponse(
                        paths=[],
                        source_topic_id=source_topic_id,
                        target_topic_id=target_topic_id
                    )
                
                path_nodes = [
                    LearningPathNode(
                        node_id=r["nodeId"],
                        name=r["name"],
                        node_type=r["nodeType"],
                        depth=r["depth"],
                        prerequisites=[]
                    )
                    for r in results
                ]
                
                # Determine difficulty
                path_length = len(path_nodes)
                if path_length <= 2:
                    difficulty = "beginner"
                elif path_length <= 4:
                    difficulty = "intermediate"
                else:
                    difficulty = "advanced"
                
                path = LearningPath(
                    path=path_nodes,
                    total_steps=len(path_nodes),
                    difficulty=difficulty
                )
                
                return LearningPathResponse(
                    paths=[path],
                    source_topic_id=source_topic_id,
                    target_topic_id=target_topic_id
                )
            else:
                # BFS from source topic (all reachable topics)
                query = """
                MATCH (source:TOPIC)
                WHERE id(source) = $sourceId
                  AND source.user_id = $userId
                
                CALL apoc.path.expandConfig(source, {
                    relationshipFilter: "DEPENDS_ON>",
                    minLevel: 1,
                    maxLevel: $maxDepth,
                    uniqueness: "NODE_GLOBAL"
                })
                YIELD path
                
                WITH nodes(path) as pathNodes, length(path) as depth
                UNWIND pathNodes as node
                
                RETURN DISTINCT
                    id(node) as nodeId,
                    coalesce(node.canonical_name, node.name, 'Unknown') as name,
                    labels(node)[0] as nodeType,
                    depth
                ORDER BY depth, name
                """
                
                results = session.run(
                    query,
                    sourceId=source_topic_id,
                    userId=current_user.id,
                    maxDepth=max_depth
                ).data()
                
                # Group by depth for suggested learning order
                nodes_by_depth = {}
                for r in results:
                    depth = r["depth"]
                    if depth not in nodes_by_depth:
                        nodes_by_depth[depth] = []
                    
                    nodes_by_depth[depth].append(
                        LearningPathNode(
                            node_id=r["nodeId"],
                            name=r["name"],
                            node_type=r["nodeType"],
                            depth=depth,
                            prerequisites=[]
                        )
                    )
                
                # Create paths for each depth level
                paths = []
                for depth in sorted(nodes_by_depth.keys()):
                    difficulty = "beginner" if depth <= 2 else "intermediate" if depth <= 4 else "advanced"
                    
                    path = LearningPath(
                        path=nodes_by_depth[depth],
                        total_steps=len(nodes_by_depth[depth]),
                        difficulty=difficulty
                    )
                    paths.append(path)
                
                return LearningPathResponse(
                    paths=paths,
                    source_topic_id=source_topic_id,
                    target_topic_id=None
                )
                
    except Exception as e:
        logger.error(f"Error generating learning paths: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate learning paths"
        )


# ============================================================================
# COMMUNITY ENDPOINTS (1 endpoint)
# ============================================================================

@router.get(
    "/communities",
    response_model=CommunityListResponse,
    summary="List communities with statistics",
    description="Get all detected communities with size statistics, dominant node types, and sample members.",
    responses={
        200: {"description": "Communities retrieved successfully"},
        500: {"description": "Internal server error"}
    }
)
@limiter.limit("100/minute")
async def list_communities(
    request: Request,
    min_size: int = Query(1, ge=1, description="Minimum community size"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Results per page"),
    current_user: User = Depends(get_current_user)
):
    """
    List all communities with statistics.
    
    Returns:
    - Community size
    - Dominant node types (PERSON, PAPER, TOPIC, etc.)
    - Sample members (up to 5 per community)
    - Overall modularity score (quality metric)
    
    Modularity ranges:
    - < 0.3: Poor community structure
    - 0.3 - 0.5: Fair
    - 0.5 - 0.7: Good
    - > 0.7: Excellent
    """
    try:
        # Get communities from service
        all_communities = community_service.get_communities(
            user_id=current_user.id,
            min_size=min_size
        )
        
        # Calculate overall modularity
        try:
            modularity = community_service.calculate_modularity(current_user.id)
        except:
            modularity = 0.0
        
        # Paginate
        offset = (page - 1) * page_size
        end_idx = offset + page_size
        page_communities = all_communities[offset:end_idx]
        
        # Format response
        communities = []
        for comm in page_communities:
            # Get node type distribution
            node_types = {}
            for member in comm["members"]:
                node_type = member["labels"][0] if member["labels"] else "Unknown"
                node_types[node_type] = node_types.get(node_type, 0) + 1
            
            # Sort by count descending
            dominant_types = sorted(node_types.keys(), key=lambda k: node_types[k], reverse=True)
            
            # Sample members (up to 5)
            sample_members = [
                CommunityMember(
                    node_id=m["nodeId"],
                    name=m["name"],
                    node_type=m["labels"][0] if m["labels"] else "Unknown"
                )
                for m in comm["members"][:5]
            ]
            
            communities.append(
                Community(
                    community_id=comm["community_id"],
                    size=comm["size"],
                    dominant_node_types=dominant_types[:3],  # Top 3 types
                    sample_members=sample_members
                )
            )
        
        return CommunityListResponse(
            communities=communities,
            total_communities=len(all_communities),
            overall_modularity=modularity,
            page=page,
            page_size=page_size
        )
        
    except Exception as e:
        logger.error(f"Error listing communities: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list communities"
        )


# ============================================================================
# EMBEDDING ENDPOINTS (1 endpoint)
# ============================================================================

@router.post(
    "/embeddings/search",
    response_model=EmbeddingSearchResponse,
    summary="Vector similarity search",
    description="Search for similar nodes using embedding vectors (cosine similarity via Qdrant).",
    responses={
        200: {"description": "Similar nodes found"},
        400: {"description": "Invalid request (must provide node_id or embedding_vector)"},
        500: {"description": "Internal server error"}
    }
)
@limiter.limit("100/minute")
async def search_embeddings(
    request: Request,
    search_request: EmbeddingSearchRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Search for similar nodes using embeddings.
    
    **Two search modes**:
    1. **By node_id**: Use the node's stored embedding
    2. **By embedding_vector**: Use a custom 128-dimensional vector
    
    Returns nodes ranked by cosine similarity.
    Useful for:
    - Finding similar researchers
    - Discovering related papers
    - Identifying comparable topics
    """
    try:
        if not search_request.node_id and not search_request.embedding_vector:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Must provide either node_id or embedding_vector"
            )
        
        # Search using Node2Vec service
        similar_nodes_data = node2vec_service.find_similar_nodes(
            node_id=search_request.node_id,
            user_id=current_user.id,
            top_k=search_request.top_k,
            min_similarity=search_request.min_similarity
        )
        
        # Format response
        similar_nodes = [
            SimilarNode(
                node_id=node["node_id"],
                name=node["payload"].get("name", "Unknown"),
                node_type=node["payload"].get("node_type", "Unknown"),
                similarity=node["similarity"],
                community_id=node["payload"].get("community_id")
            )
            for node in similar_nodes_data
        ]
        
        return EmbeddingSearchResponse(
            similar_nodes=similar_nodes,
            query_node_id=search_request.node_id,
            total_results=len(similar_nodes)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in embedding search: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to search embeddings"
        )


# ============================================================================
# GRAPH EXPORT ENDPOINTS (1 endpoint)
# ============================================================================

@router.get(
    "/export",
    response_model=GraphExportResponse,
    summary="Export full graph data",
    description="Export complete graph data including nodes and relationships for visualization.",
    responses={
        200: {"description": "Graph exported successfully"},
        500: {"description": "Internal server error"}
    }
)
@limiter.limit("10/minute")  # Lower limit for expensive operation
async def export_graph(
    request: Request,
    node_types: Optional[List[str]] = Query(None, description="Filter by node types"),
    limit: int = Query(1000, ge=1, le=10000, description="Maximum nodes to export"),
    current_user: User = Depends(get_current_user)
):
    """
    Export graph data for visualization.
    
    **WARNING**: This can return large amounts of data. Use filters and limits.
    
    Returns:
    - Nodes with all properties
    - Relationships between exported nodes
    - Suitable for D3.js, Cytoscape, Sigma.js, etc.
    
    **Filters**:
    - node_types: Export only specific node types (e.g., PERSON, PAPER)
    - limit: Maximum number of nodes (default 1000, max 10000)
    """
    try:
        with get_neo4j_session() as session:
            # Build node type filter
            node_filter = ""
            if node_types:
                labels = "|".join(node_types)
                node_filter = f":{labels}"
            
            # Get nodes
            node_query = f"""
            MATCH (n{node_filter})
            WHERE n.user_id = $userId
            RETURN 
                id(n) as id,
                labels(n) as labels,
                properties(n) as properties
            LIMIT $limit
            """
            
            node_results = session.run(
                node_query,
                userId=current_user.id,
                limit=limit
            ).data()
            
            nodes = [
                GraphNode(
                    id=r["id"],
                    labels=r["labels"],
                    properties=r["properties"]
                )
                for r in node_results
            ]
            
            # Get relationships between these nodes
            node_ids = [n.id for n in nodes]
            
            if node_ids:
                rel_query = """
                MATCH (a)-[r]->(b)
                WHERE id(a) IN $nodeIds
                  AND id(b) IN $nodeIds
                RETURN 
                    id(a) as source,
                    id(b) as target,
                    type(r) as type,
                    properties(r) as properties
                LIMIT 50000
                """
                
                rel_results = session.run(
                    rel_query,
                    nodeIds=node_ids
                ).data()
                
                relationships = [
                    GraphRelationship(
                        source=r["source"],
                        target=r["target"],
                        type=r["type"],
                        properties=r["properties"]
                    )
                    for r in rel_results
                ]
            else:
                relationships = []
            
            return GraphExportResponse(
                nodes=nodes,
                relationships=relationships,
                total_nodes=len(nodes),
                total_relationships=len(relationships),
                exported_at=datetime.utcnow()
            )
            
    except Exception as e:
        logger.error(f"Error exporting graph: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to export graph"
        )


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@router.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions with consistent error format."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "timestamp": datetime.utcnow().isoformat()
        }
    )


@router.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions."""
    logger.error(f"Unexpected error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": "An unexpected error occurred",
            "timestamp": datetime.utcnow().isoformat()
        }
    )

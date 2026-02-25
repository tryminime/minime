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

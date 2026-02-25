"""
Graph API Router
RESTful endpoints for knowledge graph queries and analytics.
"""

from typing import List, Optional
from datetime import datetime
import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address

from backend.auth.jwt_handler import get_current_user
from backend.models import User
from backend.services.node2vec_service import node2vec_service
from backend.services.community_service import community_service
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
router = APIRouter(tags=["graph"])

# Rate limiter
limiter = Limiter(key_func=get_remote_address)


# ============================================================================
# NODE ENDPOINTS
# ============================================================================

@router.get(
    "/nodes/{node_id}",
    response_model=NodeDetail,
    summary="Get node details with metrics",
    description="Retrieve detailed information about a specific node including centrality metrics, embeddings, and community assignment."
)
@limiter.limit("100/minute")
async def get_node_details(
    request: Request,
    node_id: int,
    current_user: User = Depends(get_current_user)
):
    """
    Get comprehensive node details.
    
    Returns:
    - Basic node properties
    - Centrality metrics (degree, betweenness, closeness, eigenvector, PageRank)
    - Community assignment
    - Reduced embedding (8 dimensions)
    - Neighbor count
    """
    try:
        with get_neo4j_session() as session:
            query = """
            MATCH (n)
            WHERE id(n) = $nodeId
              AND n.user_id = $userId
            OPTIONAL MATCH (n)-[r]-(neighbor)
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
                    detail=f"Node {node_id} not found"
                )
            
            # Build metrics
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
    summary="Get node neighbors (1-hop)",
    description="Retrieve all direct neighbors of a node with relationship information."
)
@limiter.limit("100/minute")
async def get_node_neighbors(
    request: Request,
    node_id: int,
    relationship_types: Optional[List[str]] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """
    Get 1-hop neighbors of a node.
    
    Optional filtering by relationship types.
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
            
            RETURN 
                id(neighbor) as neighborId,
                labels(neighbor) as labels,
                coalesce(neighbor.canonical_name, neighbor.name, 'Unknown') as name,
                type(r) as relationshipType,
                r.weight as weight
            ORDER BY weight DESC
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
# EXPERT ENDPOINTS
# ============================================================================

@router.get(
    "/experts",
    response_model=ExpertListResponse,
    summary="Get global expert rankings",
    description="Retrieve top experts globally or filtered by topic, ranked by PageRank."
)
@limiter.limit("100/minute")
async def get_experts(
    request: Request,
    topic_id: Optional[int] = Query(None, description="Filter by topic"),
    pagination: PaginationParams = Depends(),
    current_user: User = Depends(get_current_user)
):
    """
    Get expert rankings.
    
    - Global: Returns top experts overall
    - By topic: Returns experts for specific topic (via ON_TOPIC relationships)
    
    Ranked by PageRank centrality.
    """
    try:
        with get_neo4j_session() as session:
            if topic_id:
                # Topic-specific experts
                query = """
                MATCH (topic)
                WHERE id(topic) = $topicId
                  AND topic.user_id = $userId
                
                MATCH (person:PERSON)-[:ON_TOPIC]->(topic)
                WHERE person.pagerank IS NOT NULL
                
                OPTIONAL MATCH (person)-[:AUTHORED]->(paper:PAPER)
                
                WITH person, 
                     count(DISTINCT paper) as paperCount,
                     person.pagerank as pagerank
                
                RETURN 
                    id(person) as nodeId,
                    coalesce(person.canonical_name, person.name) as name,
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
                    "offset": pagination.offset,
                    "limit": pagination.page_size
                }
            else:
                # Global experts
                query = """
                MATCH (person:PERSON)
                WHERE person.user_id = $userId
                  AND person.pagerank IS NOT NULL
                
                OPTIONAL MATCH (person)-[:AUTHORED]->(paper:PAPER)
                
                WITH person,
                     count(DISTINCT paper) as paperCount,
                     person.pagerank as pagerank
                
                RETURN 
                    id(person) as nodeId,
                    coalesce(person.canonical_name, person.name) as name,
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
                    "offset": pagination.offset,
                    "limit": pagination.page_size
                }
            
            results = session.run(query, **params).data()
            
            # Get total count
            count_query = """
            MATCH (person:PERSON)
            WHERE person.user_id = $userId
              AND person.pagerank IS NOT NULL
            RETURN count(person) as total
            """
            
            total_count = session.run(
                count_query,
                userId=current_user.id
            ).single()["total"]
            
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
                page=pagination.page,
                page_size=pagination.page_size,
                topic_id=topic_id
            )
            
    except Exception as e:
        logger.error(f"Error fetching experts: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch experts"
        )



# ============================================================================
# VISUALIZATION ENDPOINT (PostgreSQL-based, no Neo4j required)
# ============================================================================

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database.postgres import get_db
from backend.models import Activity
from backend.auth.jwt_handler import decode_token, verify_token_type
from sqlalchemy import select
from datetime import timedelta, timezone
import uuid as uuid_lib

_security = HTTPBearer()

@router.get("/visualization")
async def get_graph_visualization(
    credentials: HTTPAuthorizationCredentials = Depends(_security),
    db: AsyncSession = Depends(get_db),
):
    """
    Build a knowledge graph visualization from real activity data.
    Creates nodes for user, skills/apps, domains and edges showing relationships.
    """
    # Extract user_id from JWT
    token = credentials.credentials
    payload = decode_token(token)
    if not payload or not verify_token_type(payload, "access"):
        raise HTTPException(status_code=401, detail="Invalid token")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    result = await db.execute(
        select(Activity).where(
            Activity.user_id == uuid_lib.UUID(user_id),
        ).limit(500)
    )
    activities = result.scalars().all()

    # Build graph from activity data
    nodes = []
    edges = []
    node_ids = set()

    # Central user node
    nodes.append({
        "id": "user",
        "label": "You",
        "type": "PERSON",
        "size": 20,
    })
    node_ids.add("user")

    # Skill mapping
    skill_map = {
        "VS Code": ("Programming", "SKILL"),
        "Terminal": ("DevOps", "SKILL"),
        "Chrome": ("Research", "SKILL"),
        "Figma": ("Design", "SKILL"),
        "Slack": ("Communication", "SKILL"),
        "Notion": ("Documentation", "SKILL"),
        "Zoom": ("Meetings", "SKILL"),
        "Google Meet": ("Meetings", "SKILL"),
    }

    # Block-list of purged/demo entities that should not appear in the graph
    BLOCKED_APPS = {'TestApp', 'VerifyApp', 'Chrome stackoverflow.com'}

    # Aggregate app usage (excluding blocked)
    app_time = {}
    domain_time = {}
    for a in activities:
        if a.app and a.app not in BLOCKED_APPS:
            app_time[a.app] = app_time.get(a.app, 0) + (a.duration_seconds or 0)
        if a.domain:
            domain_time[a.domain] = domain_time.get(a.domain, 0) + (a.duration_seconds or 0)

    # Add skill nodes from apps
    skill_nodes = {}
    for app, seconds in app_time.items():
        skill_name, node_type = skill_map.get(app, (app, "SKILL"))
        if skill_name in skill_nodes:
            skill_nodes[skill_name]["seconds"] += seconds
        else:
            skill_nodes[skill_name] = {"seconds": seconds, "type": node_type}

    for skill_name, info in skill_nodes.items():
        node_id = f"skill_{skill_name.lower().replace(' ', '_')}"
        if node_id not in node_ids:
            size = min(18, max(6, info["seconds"] / 1800))  # Scale by time
            nodes.append({
                "id": node_id,
                "label": skill_name,
                "type": info["type"],
                "size": round(size, 1),
            })
            node_ids.add(node_id)
            edges.append({
                "source": "user",
                "target": node_id,
                "weight": round(info["seconds"] / 3600, 1),
                "label": "USES",
            })

    # Add domain nodes (top 8)
    top_domains = sorted(domain_time.items(), key=lambda x: -x[1])[:8]
    for domain, seconds in top_domains:
        node_id = f"domain_{domain.replace('.', '_')}"
        if node_id not in node_ids:
            size = min(14, max(5, seconds / 600))
            nodes.append({
                "id": node_id,
                "label": domain,
                "type": "DOCUMENT",
                "size": round(size, 1),
            })
            node_ids.add(node_id)
            # Connect domain to Research skill
            research_id = "skill_research"
            if research_id in node_ids:
                edges.append({
                    "source": research_id,
                    "target": node_id,
                    "weight": round(seconds / 3600, 1),
                    "label": "BROWSED",
                })
            else:
                edges.append({
                    "source": "user",
                    "target": node_id,
                    "weight": round(seconds / 3600, 1),
                    "label": "VISITED",
                })

    # Add project nodes from meeting titles
    projects = set()
    for a in activities:
        if a.type == "meeting" and a.title:
            project_name = a.title
            if project_name not in projects:
                projects.add(project_name)
                node_id = f"project_{len(projects)}"
                nodes.append({
                    "id": node_id,
                    "label": project_name,
                    "type": "PROJECT",
                    "size": 10,
                })
                node_ids.add(node_id)
                edges.append({
                    "source": "user",
                    "target": node_id,
                    "weight": 1,
                    "label": "ATTENDED",
                })
                # Connect to Meetings skill
                meetings_id = "skill_meetings"
                if meetings_id in node_ids:
                    edges.append({
                        "source": meetings_id,
                        "target": node_id,
                        "weight": 1,
                        "label": "RELATED",
                    })

    # Compute stats
    total_edges = len(edges)
    total_nodes = len(nodes)
    avg_degree = (total_edges * 2 / max(total_nodes, 1)) if total_nodes > 0 else 0

    return {
        "nodes": nodes,
        "edges": edges,
        "stats": {
            "node_count": total_nodes,
            "edge_count": total_edges,
            "avg_degree": round(avg_degree, 1),
        }
    }

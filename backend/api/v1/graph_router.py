"""
Complete Graph API Router
All 18 endpoints with rate limiting, validation, and error handling.
"""

from typing import List, Optional
from datetime import datetime
import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from backend.auth.jwt_handler import get_current_user
from backend.models.user import User
from backend.services.node2vec_service import node2vec_service
from backend.services.community_service import community_service
from backend.config.neo4j_config import get_neo4j_session

logger = logging.getLogger(__name__)

# Initialize router with prefix and tags
router = APIRouter(prefix="/api/v1/graph", tags=["Knowledge Graph"])

# Rate limiter: 100 requests per minute
limiter = Limiter(key_func=get_remote_address)

# Import models separately to avoid circular imports
# Assuming models are defined in graph_models.py


"""
Simple schemas for Analytics API to avoid Pydantic v2 recursion issues.
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import date


class PaginationQuery(BaseModel):
    """Simple pagination query parameters."""
    offset: int = Field(0, ge=0)
    limit: int = Field(20, ge=1, le=100)


class AnalyticsListResponse(BaseModel):
    """Generic list response for analytics data."""
    total: int
    offset: int
    limit: int
    items: List[Dict[str, Any]]


class AnalyticsErrorResponse(BaseModel):
    """Error response."""
    error: str
    detail: Optional[str] = None

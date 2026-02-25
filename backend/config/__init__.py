"""
Backend configuration package.

Contains configuration modules for:
- Celery task queue
- Application settings
"""

from backend.config.settings import settings

__all__ = ["settings"]

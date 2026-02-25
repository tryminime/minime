"""
Configuration management for MiniMe application.
Handles environment variables, database connections, and app settings.
"""

from typing import Optional, List
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator


class Settings(BaseSettings):
    """Application settings from environment variables."""
    
    # Environment
    ENVIRONMENT: str = Field(default="development", description="Environment: development, staging, production")
    DEBUG: bool = Field(default=True, description="Debug mode")
    
    # API Configuration
    API_V1_PREFIX: str = Field(default="/api/v1", description="API version 1 prefix")
    PROJECT_NAME: str = Field(default="MiniMe API", description="Project name")
    VERSION: str = Field(default="0.1.0", description="API version")
    
    # Database URLs
    DATABASE_URL: str = Field(..., description="PostgreSQL connection URL")
    NEO4J_URI: str = Field(..., description="Neo4j connection URI")
    NEO4J_USER: str = Field(default="neo4j", description="Neo4j username")
    NEO4J_PASSWORD: str = Field(..., description="Neo4j password")
    REDIS_URL: str = Field(..., description="Redis connection URL")
    QDRANT_URL: str = Field(..., description="Qdrant connection URL")
    
    # JWT Configuration
    JWT_SECRET_KEY: str = Field(..., description="Secret key for JWT signing")
    JWT_ALGORITHM: str = Field(default="HS256", description="JWT algorithm")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=15, description="Access token expiration (minutes)")
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7, description="Refresh token expiration (days)")
    
    # Security
    BCRYPT_ROUNDS: int = Field(default=10, description="Bcrypt hashing rounds")
    CORS_ORIGINS: str = Field(
        default="http://localhost:3000,http://localhost:8000,https://app.tryminime.com,https://tryminime.com",
        description="CORS allowed origins (comma-separated)"
    )

    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = Field(default=1000, description="Rate limit per minute per user")
    RATE_LIMIT_BURST: int = Field(default=100, description="Rate limit burst allowance")
    
    # LLM Configuration (Optional)
    OPENAI_API_KEY: Optional[str] = Field(default=None, description="OpenAI API key")
    ANTHROPIC_API_KEY: Optional[str] = Field(default=None, description="Anthropic API key")
    OLLAMA_BASE_URL: str = Field(default="http://localhost:11434", description="Ollama base URL for local LLM")
    
    # Email Configuration
    SMTP_HOST: str = Field(default="smtp.gmail.com", description="SMTP server host")
    SMTP_PORT: int = Field(default=587, description="SMTP server port")
    SMTP_USER: Optional[str] = Field(default=None, description="SMTP username")
    SMTP_PASSWORD: Optional[str] = Field(default=None, description="SMTP password")
    EMAIL_FROM: str = Field(default="noreply@minime.ai", description="Email sender address")
    
    # Feature Flags
    ENABLE_RAG_ASSISTANT: bool = Field(default=True, description="Enable RAG-based AI assistant")
    ENABLE_BURNOUT_DETECTION: bool = Field(default=False, description="Enable burnout detection (enterprise)")
    ENABLE_ENTERPRISE_FEATURES: bool = Field(default=False, description="Enable enterprise features")
    
    # Logging
    LOG_LEVEL: str = Field(default="INFO", description="Logging level")
    
    # Celery Configuration (Background Tasks)
    CELERY_BROKER_URL: Optional[str] = Field(default=None, description="Celery broker URL (defaults to REDIS_URL)")
    CELERY_RESULT_BACKEND: Optional[str] = Field(default=None, description="Celery result backend (defaults to REDIS_URL)")
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Get CORS origins as a list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    @property
    def celery_broker(self) -> str:
        """Get Celery broker URL (defaults to Redis)."""
        return self.CELERY_BROKER_URL or self.REDIS_URL
    
    @property
    def celery_backend(self) -> str:
        """Get Celery result backend (defaults to Redis)."""
        return self.CELERY_RESULT_BACKEND or self.REDIS_URL
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields from .env


# Global settings instance
settings = Settings()


# Database connection helpers
def get_database_url() -> str:
    """Get PostgreSQL database URL."""
    return settings.DATABASE_URL


def get_neo4j_config() -> dict:
    """Get Neo4j connection configuration."""
    return {
        "uri": settings.NEO4J_URI,
        "auth": (settings.NEO4J_USER, settings.NEO4J_PASSWORD)
    }


def get_redis_url() -> str:
    """Get Redis connection URL."""
    return settings.REDIS_URL


def get_qdrant_config() -> dict:
    """Get Qdrant client configuration."""
    return {
        "url": settings.QDRANT_URL
    }


# Export settings
__all__ = ["settings", "get_database_url", "get_neo4j_config", "get_redis_url", "get_qdrant_config"]

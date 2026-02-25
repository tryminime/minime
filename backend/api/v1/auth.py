"""
Authentication API endpoints.
Handles user registration, login, logout, token refresh.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import structlog

from backend.database.postgres import get_db
from backend.auth.jwt_handler import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_token_type,
    get_user_id_from_token
)
from backend.auth.password import hash_password, verify_password, validate_password_strength

logger = structlog.get_logger()
router = APIRouter()
security = HTTPBearer()


# =====================================================
# REQUEST/RESPONSE MODELS
# =====================================================

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: str
    email: str
    username: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str = "user"
    tier: str = "free"
    subscription_status: str = "free"
    created_at: str
    email_verified: bool


# =====================================================
# ENDPOINTS
# =====================================================

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """
    Register a new user account.
    
    - **email**: User's email address
    - **password**: Strong password (min 8 chars, uppercase, lowercase, digit, special char)
    - **full_name**: Optional full name
    
    Returns access and refresh tokens on success.
    """
    from sqlalchemy import select
    from backend.models import User
    from datetime import datetime
    
    # Validate password strength
    is_valid, error_message = validate_password_strength(request.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message
        )
    
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == request.email))
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        # Allow re-registration if account was deleted
        if hasattr(existing_user, 'deleted_at') and existing_user.deleted_at is not None:
            await db.delete(existing_user)
            await db.flush()
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    # Hash password
    password_hash = hash_password(request.password)
    
    # Create user in database
    new_user = User(
        email=request.email,
        password_hash=password_hash,
        full_name=request.full_name,
        tier="free",
        subscription_status="active",
        email_verified=False,
        preferences={},
        privacy_settings={"track_desktop": True, "track_web": True, "track_mobile": True}
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    user_id = str(new_user.id)
    
    # Generate tokens
    access_token = create_access_token({"sub": user_id, "email": request.email})
    refresh_token = create_refresh_token({"sub": user_id})
    
    logger.info("User registered", user_id=user_id, email=request.email)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Login with email and password.
    
    - **email**: User's email address
    - **password**: User's password
    
    Returns access and refresh tokens on success.
    """
    from sqlalchemy import select
    from backend.models import User
    
    # Fetch user from database
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Verify password
    if not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Block deleted accounts
    if hasattr(user, 'deleted_at') and user.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deleted. Please register again to enjoy our services."
        )
    
    user_id = str(user.id)
    
    # Generate tokens
    access_token = create_access_token({"sub": user_id, "email": request.email})
    refresh_token = create_refresh_token({"sub": user_id})
    
    logger.info("User logged in", user_id=user_id, email=request.email)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_access_token(request: RefreshRequest):
    """
    Refresh an access token using a valid refresh token.
    
    - **refresh_token**: Valid refresh token
    
    Returns new access and refresh tokens.
    """
    # Decode and validate refresh token
    payload = decode_token(request.refresh_token)
    
    if not payload or not verify_token_type(payload, "refresh"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    # TODO: Verify refresh token exists in sessions table and is not revoked
    
    # Generate new tokens
    access_token = create_access_token({"sub": user_id})
    new_refresh_token = create_refresh_token({"sub": user_id})
    
    logger.info("Token refreshed", user_id=user_id)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token
    )


@router.post("/logout")
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Logout and revoke tokens.
    
    Requires: Authorization header with Bearer token
    """
    token = credentials.credentials
    user_id = get_user_id_from_token(token)
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    # TODO: Revoke refresh token in database
    # await db.execute(
    #     update(Session)
    #     .where(Session.user_id == user_id)
    #     .values(revoked=True)
    # )
    
    logger.info("User logged out", user_id=user_id)
    
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current authenticated user profile.
    
    Requires: Authorization header with Bearer token
    """
    token = credentials.credentials
    payload = decode_token(token)
    
    if not payload or not verify_token_type(payload, "access"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token"
        )
    
    user_id = payload.get("sub")
    
    from sqlalchemy import select
    from backend.models import User
    import uuid as uuid_lib
    
    # Fetch user from database
    result = await db.execute(select(User).where(User.id == uuid_lib.UUID(user_id)))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Block deleted accounts
    if hasattr(user, 'deleted_at') and user.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deleted"
        )
    
    return UserResponse(
        id=str(user.id),
        email=user.email,
        username=user.full_name or user.email.split('@')[0],
        full_name=user.full_name,
        avatar_url=user.avatar_url if hasattr(user, 'avatar_url') else None,
        role="user",
        tier=user.tier or "free",
        subscription_status=user.subscription_status or "free",
        created_at=user.created_at.isoformat() if user.created_at else None,
        email_verified=user.email_verified
    )

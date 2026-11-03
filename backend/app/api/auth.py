"""
ORVANTA Cloud — Auth API Routes
"""

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.rate_limit import auth_limiter, password_reset_limiter, enforce
from app.db.database import get_db
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    TokenResponse,
    UserWithOrg,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    MessageResponse,
    GoogleSignInRequest,
    ClerkSignInRequest,
    SupabaseSignInRequest,
)
from app.services.auth_service import (
    register_user,
    login_user,
    request_password_reset,
    reset_password,
    clerk_sign_in,
    google_sign_in,
    supabase_sign_in,
)
from app.core.deps import get_current_org

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(request: Request, data: UserRegister, db: AsyncSession = Depends(get_db)):
    """Register a new user and create an organization."""
    enforce(auth_limiter, request, "register")
    return await register_user(data, db)


@router.post("/login", response_model=TokenResponse)
async def login(request: Request, data: UserLogin, db: AsyncSession = Depends(get_db)):
    """Login and receive a JWT token."""
    enforce(auth_limiter, request, "login")
    return await login_user(data, db)


@router.post("/google", response_model=TokenResponse)
async def google_login(request: Request, data: GoogleSignInRequest, db: AsyncSession = Depends(get_db)):
    """Login/register with Google credential and receive JWT token."""
    enforce(auth_limiter, request, "google")
    return await google_sign_in(data, db)

@router.post("/clerk", response_model=TokenResponse)
async def clerk_login(request: Request, data: ClerkSignInRequest, db: AsyncSession = Depends(get_db)):
    """Login/register with Clerk session token and receive app JWT."""
    enforce(auth_limiter, request, "clerk")
    return await clerk_sign_in(data, db)


@router.post("/supabase", response_model=TokenResponse)
async def supabase_login(request: Request, data: SupabaseSignInRequest, db: AsyncSession = Depends(get_db)):
    """Login/register with Supabase access token and receive app JWT."""
    enforce(auth_limiter, request, "supabase")
    return await supabase_sign_in(data, db)


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(request: Request, data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Request a password reset email."""
    enforce(password_reset_limiter, request, "forgot-password")
    return await request_password_reset(data, db)


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password_route(request: Request, data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Reset password using a valid reset token."""
    enforce(password_reset_limiter, request, "reset-password")
    return await reset_password(data, db)


@router.get("/me", response_model=UserWithOrg)
async def get_me(org_context: tuple = Depends(get_current_org)):
    """Get current authenticated user and organization."""
    user, org, membership = org_context
    from app.schemas.auth import UserResponse, OrgResponse
    return UserWithOrg(
        user=UserResponse.model_validate(user),
        organization=OrgResponse.model_validate(org),
        role=membership.role.value,
    )

"""
ORVANTA Cloud — FastAPI Dependencies
Common dependencies for route handlers: auth, DB session, org context.
"""

from fastapi import Depends, HTTPException, status, Header
import secrets

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from typing import Optional
from uuid import UUID

from app.db.database import get_db
from app.core.security import hash_password
from app.models.user import User
from app.models.organization import Organization, OrgMember, OrgRole

# Login has been removed from the product. Every request runs as a single
# shared workspace user, created automatically the first time it is needed.
DEFAULT_USER_EMAIL = "workspace@orvanta.ai"
DEFAULT_USERNAME = "workspace"
DEFAULT_ORG_SLUG = "orvanta-workspace"
DEFAULT_ORG_NAME = "ORVANTA"


async def _get_or_create_default_user(db: AsyncSession) -> User:
    result = await db.execute(select(User).where(User.email == DEFAULT_USER_EMAIL))
    user = result.scalar_one_or_none()
    if user is None:
        user = User(
            email=DEFAULT_USER_EMAIL,
            username=DEFAULT_USERNAME,
            hashed_password=hash_password(secrets.token_urlsafe(32)),
            full_name="Workspace",
            is_active=True,
        )
        db.add(user)
        await db.flush()

    membership = (
        await db.execute(select(OrgMember).where(OrgMember.user_id == user.id).limit(1))
    ).scalar_one_or_none()
    if membership is None:
        org = (
            await db.execute(select(Organization).where(Organization.slug == DEFAULT_ORG_SLUG))
        ).scalar_one_or_none()
        if org is None:
            org = Organization(name=DEFAULT_ORG_NAME, slug=DEFAULT_ORG_SLUG)
            db.add(org)
            await db.flush()
        db.add(OrgMember(user_id=user.id, organization_id=org.id, role=OrgRole.ADMIN))
        await db.flush()

    await db.commit()
    return user


async def get_current_user(db: AsyncSession = Depends(get_db)) -> User:
    """Return the shared workspace user (no login required)."""
    try:
        return await _get_or_create_default_user(db)
    except IntegrityError:
        # Another request created it concurrently — read it back.
        await db.rollback()
        return await _get_or_create_default_user(db)


async def get_current_org(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> tuple:
    """Get the user's organization and membership. Returns (user, org, membership)."""
    result = await db.execute(
        select(OrgMember, Organization)
        .join(Organization, OrgMember.organization_id == Organization.id)
        .where(OrgMember.user_id == user.id)
        .limit(1)
    )
    row = result.first()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not a member of any organization",
        )

    membership, org = row
    return user, org, membership


async def get_api_key_org(
    x_api_key: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> Organization:
    """Authenticate via API key header."""
    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X-API-Key header required",
        )

    result = await db.execute(
        select(Organization).where(Organization.api_key == x_api_key)
    )
    org = result.scalar_one_or_none()

    if not org or not org.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
        )

    return org


def require_admin(org_context: tuple = Depends(get_current_org)):
    """Require admin role for the current organization."""
    user, org, membership = org_context
    role_value = getattr(membership.role, "value", membership.role)
    if str(role_value).lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user, org, membership

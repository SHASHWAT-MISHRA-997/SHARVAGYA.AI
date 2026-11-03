"""
ORVANTA Cloud - Chat API Routes
"""

from typing import Any, Optional, Literal

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_org
from app.core.config import settings
from app.core.logging import get_logger
from app.core.rate_limit import chat_limiter, enforce
from app.db.database import get_db
from app.services.chat_service import generate_chat_response

logger = get_logger(__name__)

router = APIRouter(prefix="/chat", tags=["Chat"])


class ChatHistoryItem(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    history: list[ChatHistoryItem] = Field(default_factory=list, max_length=12)
    client_now_iso: Optional[str] = None
    client_tz_offset_minutes: Optional[int] = None


class ChatResponse(BaseModel):
    response: str
    provider: str
    model: str
    sources: list[dict[str, Any]] = Field(default_factory=list)


@router.post("", response_model=ChatResponse)
async def ask_assistant(
    payload: ChatRequest,
    request: Request,
    org_context: tuple = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Generate an assistant response using organization-aware context."""
    enforce(chat_limiter, request, "chat")
    _, org, _ = org_context

    if len(payload.history) > settings.AI_CHAT_MAX_HISTORY_ITEMS:
        raise HTTPException(status_code=422, detail="Too many chat history items")

    try:
        result = await generate_chat_response(
            message=payload.message,
            history=[item.model_dump() for item in payload.history],
            client_now_iso=payload.client_now_iso,
            client_tz_offset_minutes=payload.client_tz_offset_minutes,
            organization_id=org.id,
            db=db,
        )
        return ChatResponse(**result)
    except Exception as exc:
        logger.error("chat_generation_failed", error=str(exc), org_id=str(org.id))
        raise HTTPException(status_code=502, detail="Assistant is temporarily unavailable. Please try again.")

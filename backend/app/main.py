"""
ORVANTA Cloud — FastAPI Application Entry Point
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select
from uuid import UUID

from app.core.config import settings
from app.core.logging import setup_logging, get_logger
from app.db.database import init_db, AsyncSessionLocal
from app.websocket.manager import ws_manager
from app.core.security import decode_access_token
from app.models.user import User
from app.models.organization import OrgMember
from app.services.official_mode import reclassify_events_official_only

# Import all models so they register with SQLAlchemy
import app.models  # noqa: F401

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown."""
    setup_logging()
    logger.info("warops_starting", env=settings.APP_ENV)

    if settings.APP_ENV == "production":
        if settings.JWT_SECRET_KEY.startswith("change-this-"):
            raise RuntimeError(
                "JWT_SECRET_KEY is still the default placeholder. "
                "Set a strong random secret before running in production."
            )
        if settings.APP_DEBUG:
            raise RuntimeError("APP_DEBUG must be false in production")
        if not settings.FRONTEND_URL.startswith("https://"):
            raise RuntimeError("FRONTEND_URL must use HTTPS in production")
        if any(host in {"*", "localhost", "127.0.0.1"} for host in settings.ALLOWED_HOSTS):
            raise RuntimeError("Set explicit public ALLOWED_HOSTS in production")

    # Initialize database tables
    await init_db()
    logger.info("database_initialized")

    if settings.OFFICIAL_ONLY_MODE:
        async with AsyncSessionLocal() as db:
            updated = await reclassify_events_official_only(db)
        logger.info("official_only_mode_applied", updated=updated)

    yield

    logger.info("warops_shutdown")


_is_production = settings.APP_ENV == "production"

app = FastAPI(
    title="ORVANTA",
    description="Operations SaaS for verified event intelligence, analytics, risk scoring, alerts, and live management workflows",
    version="1.0.0",
    docs_url=None if _is_production else f"{settings.API_V1_PREFIX}/docs",
    redoc_url=None if _is_production else f"{settings.API_V1_PREFIX}/redoc",
    openapi_url=None if _is_production else f"{settings.API_V1_PREFIX}/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.ALLOWED_HOSTS)

# ── CORS ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=None if _is_production else r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    """Set baseline browser protections and reject unexpectedly large API bodies."""
    if request.url.path.startswith(settings.API_V1_PREFIX):
        content_length = request.headers.get("content-length")
        if content_length and content_length.isdigit() and int(content_length) > 1_000_000:
            return JSONResponse(status_code=413, content={"detail": "Request body too large"})

    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
    response.headers.setdefault("Cross-Origin-Opener-Policy", "same-origin")
    if _is_production:
        response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    return response

# ── API Routers ──
from app.api.auth import router as auth_router
from app.api.events import router as events_router
from app.api.risk import router as risk_router
from app.api.alerts import router as alerts_router
from app.api.dashboard import router as dashboard_router
from app.api.organizations import router as organizations_router
from app.api.developer import router as developer_router
from app.api.watchlists import router as watchlists_router
from app.api.chat import router as chat_router

app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(events_router, prefix=settings.API_V1_PREFIX)
app.include_router(risk_router, prefix=settings.API_V1_PREFIX)
app.include_router(alerts_router, prefix=settings.API_V1_PREFIX)
app.include_router(dashboard_router, prefix=settings.API_V1_PREFIX)
app.include_router(organizations_router, prefix=settings.API_V1_PREFIX)
app.include_router(developer_router, prefix=settings.API_V1_PREFIX)
app.include_router(watchlists_router, prefix=settings.API_V1_PREFIX)
app.include_router(chat_router, prefix=settings.API_V1_PREFIX)


# ── Health Check ──
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": settings.APP_NAME, "version": "1.0.0"}


@app.get(f"{settings.API_V1_PREFIX}/health")
async def api_health():
    """API health check."""
    return {"status": "ok", "api_version": "v1"}


# ── WebSocket Endpoint ──
@app.websocket(f"{settings.API_V1_PREFIX}/ws/{{org_id}}")
async def websocket_endpoint(websocket: WebSocket, org_id: str):
    """
    WebSocket endpoint for real-time alerts.
    Requires a valid JWT for a user who is a member of the target organization.
    """
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001)
        return

    try:
        payload = decode_access_token(token)
        user_id = UUID(str(payload.get("sub")))
        requested_org_id = UUID(org_id)
    except Exception:
        await websocket.close(code=4001)
        return

    # Verify the authenticated user belongs to the requested organization.
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(OrgMember.user_id)
            .where(
                OrgMember.user_id == user_id,
                OrgMember.organization_id == requested_org_id,
            )
            .limit(1)
        )
        member = result.scalar_one_or_none()

    if not member:
        await websocket.close(code=4003)
        return

    await ws_manager.connect(websocket, org_id)
    try:
        while True:
            # Keep connection alive, listen for client messages
            data = await websocket.receive_text()
            # Echo back as acknowledgement
            await websocket.send_text(f'{{"type":"ack","message":"received"}}')
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, org_id)


# ── Global Exception Handler ──
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error("unhandled_exception", error=str(exc), path=str(request.url))
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )

"""
ORVANTA Cloud — Database Setup
Async SQLAlchemy engine and session management.
"""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

def _resolve_database_url() -> str:
    url = settings.DATABASE_URL
    if "asyncpg" in url:
        try:
            import asyncpg  # noqa: F401
        except ImportError:
            return "sqlite+aiosqlite:///./warops.db"
    return url


_active_db_url = _resolve_database_url()


def _build_engine_kwargs() -> dict:
    # SQLite (used for lightweight local/test runs) does not support QueuePool options.
    if _active_db_url.startswith("sqlite"):
        return {"connect_args": {"check_same_thread": False}}
    return {
        "pool_size": 20,
        "max_overflow": 10,
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }


# Create async engine
engine = create_async_engine(
    _active_db_url,
    echo=settings.SQL_ECHO,
    **_build_engine_kwargs(),
)

# Session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


async def get_db() -> AsyncSession:
    """Dependency that provides a database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """Initialize database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

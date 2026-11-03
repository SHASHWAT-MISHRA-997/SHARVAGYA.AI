"""
ORVANTA Cloud — Lightweight in-memory rate limiter.

Protects auth and AI endpoints from brute-force and abuse.
Single-process sliding window; per identifier (IP or IP+email).
"""

import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request, status
from app.core.config import settings


class SlidingWindowLimiter:
    def __init__(self, max_requests: int, window_seconds: float):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._hits: dict[str, deque] = defaultdict(deque)

    def check(self, identifier: str) -> None:
        """Raise 429 if the identifier exceeded the allowed rate."""
        now = time.monotonic()
        bucket = self._hits[identifier]
        cutoff = now - self.window_seconds

        while bucket and bucket[0] < cutoff:
            bucket.popleft()

        if len(bucket) >= self.max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please slow down and try again shortly.",
            )

        bucket.append(now)

        # Opportunistic cleanup so idle identifiers do not accumulate forever.
        if len(self._hits) > 10000:
            stale = [key for key, q in self._hits.items() if not q]
            for key in stale:
                self._hits.pop(key, None)


def client_identifier(request: Request, scope: str) -> str:
    """Build a limiter key from client IP and endpoint scope.
    Prioritizes X-Real-IP set by trusted reverse proxies to prevent header spoofing.
    """
    # Forwarded headers are attacker-controlled unless a known reverse proxy
    # overwrites them. Do not trust them in direct deployments.
    if settings.TRUST_PROXY_HEADERS:
        real_ip = request.headers.get("x-real-ip")
        if real_ip and real_ip.strip():
            ip = real_ip.strip()
        else:
            forwarded = request.headers.get("x-forwarded-for")
            parts = [p.strip() for p in (forwarded or "").split(",") if p.strip()]
            ip = parts[0] if parts else (request.client.host if request.client else "unknown")
    else:
        ip = request.client.host if request.client else "unknown"
    return f"{scope}:{ip}"


# Shared limiters
auth_limiter = SlidingWindowLimiter(max_requests=10, window_seconds=60)
password_reset_limiter = SlidingWindowLimiter(max_requests=5, window_seconds=300)
chat_limiter = SlidingWindowLimiter(max_requests=20, window_seconds=60)


def enforce(limiter: SlidingWindowLimiter, request: Request, scope: str) -> None:
    limiter.check(client_identifier(request, scope))

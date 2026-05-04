"""Lightweight in-memory sliding-window rate limiter.

Single-process container → no Redis needed.  If we ever scale horizontally
this should move to Redis or a Mongo TTL collection, but for now an
asyncio-protected dict is plenty.
"""
from collections import defaultdict, deque
from time import monotonic
from asyncio import Lock
from fastapi import HTTPException, Request

_buckets: dict[str, deque] = defaultdict(deque)
_lock = Lock()


def _client_ip(request: Request) -> str:
    # Honour X-Forwarded-For when behind ingress; fall back to the socket peer.
    xff = request.headers.get("x-forwarded-for", "")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


async def enforce_rate_limit(request: Request, *, key: str, max_requests: int, window_seconds: int):
    """Raise 429 if the caller has exceeded `max_requests` within `window_seconds`.

    The bucket key is `"{key}:{ip}"` so different endpoints don't share counters.
    """
    bucket_key = f"{key}:{_client_ip(request)}"
    now = monotonic()
    cutoff = now - window_seconds
    async with _lock:
        bucket = _buckets[bucket_key]
        while bucket and bucket[0] < cutoff:
            bucket.popleft()
        if len(bucket) >= max_requests:
            retry_in = max(1, int(bucket[0] + window_seconds - now))
            raise HTTPException(
                status_code=429,
                detail=f"Too many requests. Try again in {retry_in} seconds.",
                headers={"Retry-After": str(retry_in)},
            )
        bucket.append(now)

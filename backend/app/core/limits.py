import asyncio
import math
import time
from collections import deque


class RateLimitExceeded(Exception):
    def __init__(self, retry_after: int) -> None:
        super().__init__("Rate limit exceeded")
        self.retry_after = max(1, retry_after)


class RateLimiter:
    """In-memory sliding-window rate limiter.

    The API runs with a single Uvicorn worker, so one instance enforces the
    limit for the whole process. If the worker count is increased later, this
    must move to Redis or another shared store.
    """

    def __init__(self, limit: int, window_seconds: float) -> None:
        self.limit = max(1, int(limit))
        self.window_seconds = max(0.01, float(window_seconds))
        self._buckets: dict[str, deque[float]] = {}
        self._lock = asyncio.Lock()

    async def hit(self, key: str) -> None:
        now = time.monotonic()
        boundary = now - self.window_seconds
        async with self._lock:
            bucket = self._buckets.get(key)
            if bucket is None:
                bucket = deque()
                self._buckets[key] = bucket
            while bucket and bucket[0] <= boundary:
                bucket.popleft()
            if len(bucket) >= self.limit:
                retry_after = math.ceil(self.window_seconds - (now - bucket[0]))
                raise RateLimitExceeded(retry_after)
            bucket.append(now)
            if len(self._buckets) > 10_000:
                self._purge(boundary)

    def _purge(self, boundary: float) -> None:
        stale = [
            key
            for key, bucket in self._buckets.items()
            if not bucket or bucket[-1] <= boundary
        ]
        for key in stale:
            self._buckets.pop(key, None)

import asyncio
import logging
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.api.v1.errors import install_error_handlers
from app.api.v1.router import api_router
from app.core.config import settings
from app.core.db.connection import database
from app.core.limits import RateLimiter
from app.modules.tests.seed import seed_test_catalog


logger = logging.getLogger(__name__)


def _warn_insecure_defaults() -> None:
    if settings.environment != "production":
        return
    if settings.session_secret in {"change-me", "dev-session-secret-change-me"}:
        logger.warning(
            "SESSION_SECRET uses an insecure default; set a random value"
        )
    if not settings.cookie_secure:
        logger.warning("COOKIE_SECURE is disabled in production")


@asynccontextmanager
async def lifespan(app: FastAPI):
    _warn_insecure_defaults()
    app.state.http = httpx.AsyncClient(
        timeout=httpx.Timeout(settings.ai_timeout_seconds, connect=15.0)
    )
    app.state.ai_rate_limiter = RateLimiter(
        settings.ai_rate_limit_requests,
        settings.ai_rate_limit_window_seconds,
    )
    app.state.resume_parse_semaphore = asyncio.Semaphore(
        max(1, settings.resume_parse_concurrency)
    )
    await database.start()
    await seed_test_catalog(database)
    try:
        yield
    finally:
        await app.state.http.aclose()
        await database.stop()


app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)
install_error_handlers(app)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/health", tags=["health"])
async def root_health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/ready", tags=["health"])
async def readiness() -> JSONResponse:
    try:
        async with asyncio.timeout(3):
            async with database.session() as session:
                await session.execute(text("SELECT 1"))
    except Exception as error:
        logger.warning("Readiness check failed: %s", error)
        return JSONResponse(
            status_code=503,
            content={"status": "not_ready", "database": "down"},
        )
    return JSONResponse(content={"status": "ready", "database": "up"})

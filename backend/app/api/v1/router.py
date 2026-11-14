from fastapi import APIRouter

from app.api.v1.endpoints import ai, auth, health, interviews, profile, resumes, tests

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(resumes.router, prefix="/resumes", tags=["resumes"])
api_router.include_router(interviews.router, tags=["interviews"])
api_router.include_router(profile.router, prefix="/profile", tags=["profile"])
api_router.include_router(tests.router, prefix="/tests", tags=["tests"])
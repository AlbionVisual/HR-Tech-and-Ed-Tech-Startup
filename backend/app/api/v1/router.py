from fastapi import APIRouter

from app.api.v1.endpoints import ai, health, resumes

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(resumes.router, prefix="/resumes", tags=["resumes"])

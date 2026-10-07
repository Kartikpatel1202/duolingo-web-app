from fastapi import APIRouter

from app.api.routers import (
    auth,
    courses,
    engagement,
    gamification,
    health,
    lessons,
    progress,
    users,
)

api_router = APIRouter(prefix="/api")
for module in (health, auth, users, courses, lessons, progress, gamification, engagement):
    api_router.include_router(module.router)

__all__ = ["api_router"]

from fastapi import APIRouter

from app.api.routers import courses, gamification, health, lessons, progress, users

api_router = APIRouter(prefix="/api")
for module in (health, users, courses, lessons, progress, gamification):
    api_router.include_router(module.router)

__all__ = ["api_router"]

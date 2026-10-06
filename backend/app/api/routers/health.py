from fastapi import APIRouter
from sqlalchemy import text

from app.api.deps import ContextDep
from app.schemas.gamification import HealthOut

router = APIRouter(tags=["health"])


@router.get("/health", summary="Liveness and database connectivity")
def health(ctx: ContextDep) -> HealthOut:
    ctx.session.execute(text("SELECT 1"))
    return HealthOut(status="ok", database="ok")

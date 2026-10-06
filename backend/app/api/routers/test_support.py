"""Test-only endpoints, mounted only when ENABLE_TEST_ROUTES=true (used by Playwright)."""

from fastapi import APIRouter, Request, status

from app.api.deps import ClockDep, SettingsDep
from app.schemas.gamification import ResetIn
from app.seed.seeder import reset_and_seed

router = APIRouter(prefix="/test", tags=["test-support"])


@router.post(
    "/reset",
    summary="Drop, recreate and reseed the database",
    status_code=status.HTTP_204_NO_CONTENT,
)
def reset_database(body: ResetIn, request: Request, clock: ClockDep, settings: SettingsDep) -> None:
    reset_and_seed(
        request.app.state.engine,
        request.app.state.session_factory,
        clock,
        settings,
        demo_progress=body.demo_progress,
    )

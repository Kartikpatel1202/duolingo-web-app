from fastapi import APIRouter

from app.api.deps import CompletionServiceDep, CurrentUser, ProgressServiceDep
from app.api.responses import errors
from app.schemas.progress import CompleteLessonIn, CompleteLessonOut, ProgressOut

router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("", summary="XP, daily goal, streak and course progress summary")
def get_progress(user: CurrentUser, service: ProgressServiceDep) -> ProgressOut:
    return service.summary(user)


@router.post(
    "/lesson/{lesson_id}/complete",
    summary="Complete a lesson attempt and receive rewards (idempotent)",
    responses=errors(403, 404, 409),
)
def complete_lesson(
    lesson_id: int, body: CompleteLessonIn, user: CurrentUser, service: CompletionServiceDep
) -> CompleteLessonOut:
    return service.complete(user, lesson_id, body)

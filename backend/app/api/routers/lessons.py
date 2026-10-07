from fastapi import APIRouter, Response, status

from app.api.deps import AnswerServiceDep, CurrentUser, LessonServiceDep
from app.api.responses import errors
from app.domain.enums import AttemptMode
from app.schemas.lesson import AttemptOut, CheckAnswerIn, CheckAnswerOut, LessonOut, StartAttemptIn

router = APIRouter(prefix="/lessons", tags=["lessons"])


@router.get(
    "/{lesson_id}",
    summary="Lesson exercises for play (never includes solutions)",
    responses=errors(403, 404),
)
def get_lesson(lesson_id: int, user: CurrentUser, service: LessonServiceDep) -> LessonOut:
    return service.get_lesson(user, lesson_id)


@router.post(
    "/{lesson_id}/attempts",
    summary="Start a lesson attempt, or resume the active one",
    description=(
        "201 when a new attempt is created, 200 when the in-progress attempt is resumed. "
        'Optional body `{"mode": "legendary"}` starts a Legendary challenge on a completed lesson.'
    ),
    status_code=status.HTTP_201_CREATED,
    responses={200: {"model": AttemptOut, "description": "Resumed"}, **errors(403, 404, 409)},
)
def start_attempt(
    lesson_id: int,
    response: Response,
    user: CurrentUser,
    service: LessonServiceDep,
    body: StartAttemptIn | None = None,
) -> AttemptOut:
    mode = body.mode if body else AttemptMode.STANDARD
    attempt, created = service.start_attempt(user, lesson_id, mode)
    if not created:
        response.status_code = status.HTTP_200_OK
    return attempt


@router.post(
    "/{lesson_id}/check",
    summary="Check one answer (idempotent per submission_id)",
    responses=errors(404, 409),
)
def check_answer(
    lesson_id: int, body: CheckAnswerIn, user: CurrentUser, service: AnswerServiceDep
) -> CheckAnswerOut:
    return service.check(user, lesson_id, body)

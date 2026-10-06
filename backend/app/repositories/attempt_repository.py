"""Lesson attempts and their checked answers."""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.domain.enums import AttemptStatus
from app.models import AttemptAnswer, LessonAttempt


class AttemptRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def get(self, attempt_id: str) -> LessonAttempt | None:
        return self._session.get(LessonAttempt, attempt_id)

    def get_active(self, user_id: int, lesson_id: int) -> LessonAttempt | None:
        statement = select(LessonAttempt).where(
            LessonAttempt.user_id == user_id,
            LessonAttempt.lesson_id == lesson_id,
            LessonAttempt.status == AttemptStatus.IN_PROGRESS,
        )
        return self._session.scalars(statement).one_or_none()

    def answer_by_submission(self, attempt_id: str, submission_id: str) -> AttemptAnswer | None:
        statement = select(AttemptAnswer).where(
            AttemptAnswer.attempt_id == attempt_id,
            AttemptAnswer.submission_id == submission_id,
        )
        return self._session.scalars(statement).one_or_none()

    def solved_exercise_ids(self, attempt_id: str) -> set[int]:
        statement = select(AttemptAnswer.exercise_id).where(
            AttemptAnswer.attempt_id == attempt_id, AttemptAnswer.is_correct.is_(True)
        )
        return set(self._session.scalars(statement).all())

    def mistakes(self, attempt_id: str) -> int:
        statement = select(func.count(AttemptAnswer.id)).where(
            AttemptAnswer.attempt_id == attempt_id, AttemptAnswer.is_correct.is_(False)
        )
        return self._session.scalar(statement) or 0

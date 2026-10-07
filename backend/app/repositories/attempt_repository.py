"""Lesson attempts and their checked answers."""

from datetime import datetime

from sqlalchemy import exists, func, select
from sqlalchemy.orm import Session

from app.domain.enums import AttemptMode, AttemptStatus
from app.models import AttemptAnswer, LessonAttempt


class AttemptRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def get(self, attempt_id: str) -> LessonAttempt | None:
        return self._session.get(LessonAttempt, attempt_id)

    def get_active(self, user_id: int, lesson_id: int, mode: AttemptMode) -> LessonAttempt | None:
        statement = select(LessonAttempt).where(
            LessonAttempt.user_id == user_id,
            LessonAttempt.lesson_id == lesson_id,
            LessonAttempt.mode == mode,
            LessonAttempt.status == AttemptStatus.IN_PROGRESS,
        )
        return self._session.scalars(statement).one_or_none()

    def legendary_lesson_ids(self, user_id: int) -> set[int]:
        """Lessons on which the learner has won a Legendary challenge (derived, not stored)."""
        statement = select(LessonAttempt.lesson_id).where(
            LessonAttempt.user_id == user_id,
            LessonAttempt.mode == AttemptMode.LEGENDARY,
            LessonAttempt.status == AttemptStatus.COMPLETED,
        )
        return set(self._session.scalars(statement).all())

    def first_legendary_win(self, user_id: int, lesson_id: int) -> LessonAttempt | None:
        statement = (
            select(LessonAttempt)
            .where(
                LessonAttempt.user_id == user_id,
                LessonAttempt.lesson_id == lesson_id,
                LessonAttempt.mode == AttemptMode.LEGENDARY,
                LessonAttempt.status == AttemptStatus.COMPLETED,
            )
            .order_by(LessonAttempt.completed_at, LessonAttempt.id)
            .limit(1)
        )
        return self._session.scalars(statement).first()

    def completions_between(
        self, user_id: int, start: datetime, end: datetime
    ) -> list[tuple[datetime, bool]]:
        """(completed_at, perfect) for every attempt completed in [start, end)."""
        mistake = exists().where(
            AttemptAnswer.attempt_id == LessonAttempt.id, AttemptAnswer.is_correct.is_(False)
        )
        statement = select(LessonAttempt.completed_at, ~mistake).where(
            LessonAttempt.user_id == user_id,
            LessonAttempt.status == AttemptStatus.COMPLETED,
            LessonAttempt.completed_at >= start,
            LessonAttempt.completed_at < end,
        )
        return [
            (completed_at, perfect)
            for completed_at, perfect in self._session.execute(statement)
            if completed_at
        ]

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

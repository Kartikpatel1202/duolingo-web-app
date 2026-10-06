"""Lesson-completion facts and skill milestones."""

from sqlalchemy import exists, func, select
from sqlalchemy.orm import Session

from app.domain.enums import AttemptStatus
from app.models import AttemptAnswer, LessonAttempt, UserLessonProgress, UserSkillProgress


class ProgressRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def completed_lesson_ids(self, user_id: int) -> set[int]:
        statement = select(UserLessonProgress.lesson_id).where(
            UserLessonProgress.user_id == user_id
        )
        return set(self._session.scalars(statement).all())

    def completed_skill_ids(self, user_id: int) -> set[int]:
        statement = select(UserSkillProgress.skill_id).where(
            UserSkillProgress.user_id == user_id, UserSkillProgress.completed_at.is_not(None)
        )
        return set(self._session.scalars(statement).all())

    def lesson_progress(self, user_id: int, lesson_id: int) -> UserLessonProgress | None:
        statement = select(UserLessonProgress).where(
            UserLessonProgress.user_id == user_id, UserLessonProgress.lesson_id == lesson_id
        )
        return self._session.scalars(statement).one_or_none()

    def skill_progress(self, user_id: int, skill_id: int) -> UserSkillProgress | None:
        statement = select(UserSkillProgress).where(
            UserSkillProgress.user_id == user_id, UserSkillProgress.skill_id == skill_id
        )
        return self._session.scalars(statement).one_or_none()

    def perfect_lesson_count(self, user_id: int) -> int:
        """Distinct lessons with at least one completed attempt that had no wrong answer."""
        mistake = exists().where(
            AttemptAnswer.attempt_id == LessonAttempt.id, AttemptAnswer.is_correct.is_(False)
        )
        statement = select(func.count(func.distinct(LessonAttempt.lesson_id))).where(
            LessonAttempt.user_id == user_id,
            LessonAttempt.status == AttemptStatus.COMPLETED,
            ~mistake,
        )
        return self._session.scalar(statement) or 0

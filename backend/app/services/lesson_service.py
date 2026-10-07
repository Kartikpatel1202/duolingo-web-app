"""Fetching a lesson for play and starting/resuming an attempt."""

from sqlalchemy.exc import IntegrityError

from app.domain import challenge
from app.domain.enums import AttemptMode, AttemptStatus, LessonStatus
from app.domain.errors import LegendaryLocked
from app.models import Lesson, LessonAttempt, User
from app.repositories import AttemptRepository
from app.schemas.exercise import exercise_out_adapter
from app.schemas.lesson import AttemptOut, LessonOut
from app.services.context import ServiceContext
from app.services.course_progress import CourseProgressService
from app.services.hearts_service import HeartsService


class LessonService:
    def __init__(self, ctx: ServiceContext) -> None:
        self._ctx = ctx
        self._attempts = AttemptRepository(ctx.session)
        self._course_progress = CourseProgressService(ctx)
        self._hearts = HeartsService(ctx)

    def get_lesson(self, user: User, lesson_id: int) -> LessonOut:
        lesson, _ = self._course_progress.require_unlocked_lesson(user.id, lesson_id)
        return LessonOut(
            id=lesson.id,
            skill_id=lesson.skill_id,
            title=lesson.title,
            xp_reward=lesson.xp_reward,
            # Only `content` is passed on: the public schemas have no solution field at all.
            exercises=[
                exercise_out_adapter.validate_python(
                    {
                        "id": exercise.id,
                        "position": exercise.position,
                        "type": exercise.type.value,
                        "prompt": exercise.prompt,
                        "content": exercise.content,
                    }
                )
                for exercise in lesson.exercises
            ],
        )

    def start_attempt(
        self, user: User, lesson_id: int, mode: AttemptMode = AttemptMode.STANDARD
    ) -> tuple[AttemptOut, bool]:
        """Resume the learner's in-progress attempt in this mode, or create one.
        Returns (attempt, created). Opening a lesson never awards anything."""
        lesson, progress = self._course_progress.require_unlocked_lesson(user.id, lesson_id)
        rules = challenge.MODE_RULES[mode]
        if rules.requires_completed_lesson and progress.lesson_status(lesson) is not (
            LessonStatus.COMPLETED
        ):
            raise LegendaryLocked(lesson_id=lesson_id)
        if rules.costs_hearts:
            self._hearts.require_hearts(user)

        now = self._ctx.now()
        attempt = self._attempts.get_active(user.id, lesson.id, mode)
        if attempt is not None and challenge.is_expired(mode, attempt.started_at, now):
            attempt.status = AttemptStatus.FAILED  # its clock ran out; start a fresh one
            self._ctx.session.flush()  # free the one-active-attempt slot before inserting
            attempt = None
        if attempt is not None:
            return self.attempt_out(user, lesson, attempt), False

        attempt = LessonAttempt(
            user_id=user.id,
            lesson_id=lesson.id,
            mode=mode,
            status=AttemptStatus.IN_PROGRESS,
            started_at=now,
        )
        self._ctx.session.add(attempt)
        try:
            self._ctx.session.commit()
        except IntegrityError:
            # A concurrent request created the active attempt first (partial unique index).
            self._ctx.session.rollback()
            existing = self._attempts.get_active(user.id, lesson.id, mode)
            if existing is None:
                raise
            return self.attempt_out(user, lesson, existing), False
        return self.attempt_out(user, lesson, attempt), True

    def attempt_out(self, user: User, lesson: Lesson, attempt: LessonAttempt) -> AttemptOut:
        return AttemptOut(
            attempt_id=attempt.id,
            lesson_id=lesson.id,
            mode=attempt.mode,
            status=attempt.status,
            started_at=attempt.started_at,
            expires_at=challenge.expires_at(attempt.mode, attempt.started_at),
            mistake_limit=challenge.MODE_RULES[attempt.mode].mistake_limit,
            solved_exercise_ids=sorted(self._attempts.solved_exercise_ids(attempt.id)),
            mistakes=self._attempts.mistakes(attempt.id),
            total_exercises=len(lesson.exercises),
            hearts=self._hearts.view(user),
        )

"""Checking one answer inside a lesson attempt.

Guarantees:
* every validation happens before any write, so a rejected request never costs a heart;
* the answer row and the heart deduction are committed in one transaction (both or neither);
* a retried request with the same submission_id returns the stored result without side effects;
* the attempt's mode decides the cost of a mistake: a heart (standard) or one of a limited number
  of mistakes (challenges, see app.domain.challenge).
"""

from sqlalchemy.exc import IntegrityError

from app.domain import challenge
from app.domain.enums import AttemptStatus
from app.domain.errors import (
    AlreadyCompleted,
    DuplicateSubmission,
    ExerciseAlreadySolved,
    ExerciseNotFound,
    LessonNotFound,
)
from app.domain.exercises import CheckResult, get_checker
from app.domain.exercises.base import ExerciseModel
from app.models import AttemptAnswer, Exercise, Lesson, LessonAttempt, User
from app.repositories import AttemptRepository, ContentRepository
from app.schemas.lesson import AttemptProgressOut, CheckAnswerIn, CheckAnswerOut
from app.services.attempts import ensure_not_ended, get_owned_attempt
from app.services.context import ServiceContext
from app.services.hearts_service import HeartsService


class AnswerService:
    def __init__(self, ctx: ServiceContext) -> None:
        self._ctx = ctx
        self._content = ContentRepository(ctx.session)
        self._attempts = AttemptRepository(ctx.session)
        self._hearts = HeartsService(ctx)

    def check(self, user: User, lesson_id: int, request: CheckAnswerIn) -> CheckAnswerOut:
        lesson = self._content.get_lesson(lesson_id)
        if lesson is None:
            raise LessonNotFound(lesson_id=lesson_id)
        attempt = get_owned_attempt(self._attempts, user, lesson_id, request.attempt_id)
        submitted = request.answer.model_dump(mode="json")

        stored = self._attempts.answer_by_submission(attempt.id, request.submission_id)
        if stored is not None:
            return self._replay(user, lesson, attempt, stored, request, submitted)

        if attempt.status is AttemptStatus.COMPLETED:
            raise AlreadyCompleted(attempt_id=attempt.id)
        ensure_not_ended(self._ctx.session, attempt, self._ctx.now())
        exercise = self._exercise_in(lesson, request.exercise_id)
        if exercise.id in self._attempts.solved_exercise_ids(attempt.id):
            raise ExerciseAlreadySolved(exercise_id=exercise.id)
        rules = challenge.MODE_RULES[attempt.mode]
        if rules.costs_hearts:
            self._hearts.require_hearts(user)

        result = self._evaluate(exercise, request)  # raises InvalidAnswer before any write

        self._ctx.session.add(
            AttemptAnswer(
                attempt_id=attempt.id,
                exercise_id=exercise.id,
                submission_id=request.submission_id,
                answer=submitted,
                is_correct=result.is_correct,
                created_at=self._ctx.now(),
            )
        )
        if not result.is_correct:
            if rules.costs_hearts:
                self._hearts.lose_heart(user)
            elif challenge.has_failed(attempt.mode, self._attempts.mistakes(attempt.id)):
                attempt.status = AttemptStatus.FAILED  # the challenge's last allowed mistake
        try:
            self._ctx.session.commit()
        except IntegrityError:
            # The same submission was stored by a concurrent request: answer from that one.
            self._ctx.session.rollback()
            stored = self._attempts.answer_by_submission(attempt.id, request.submission_id)
            if stored is None:
                raise
            return self._replay(user, lesson, attempt, stored, request, submitted)

        return self._response(user, lesson, attempt, exercise, request.submission_id, result)

    # --- helpers --------------------------------------------------------------------------------

    def _replay(
        self,
        user: User,
        lesson: Lesson,
        attempt: LessonAttempt,
        stored: AttemptAnswer,
        request: CheckAnswerIn,
        submitted: dict[str, object],
    ) -> CheckAnswerOut:
        """Idempotent retry: same submission_id + same payload → same result, no side effects."""
        if stored.exercise_id != request.exercise_id or stored.answer != submitted:
            raise DuplicateSubmission(submission_id=request.submission_id)
        exercise = self._exercise_in(lesson, stored.exercise_id)
        result = self._evaluate(exercise, request)
        return self._response(user, lesson, attempt, exercise, stored.submission_id, result)

    @staticmethod
    def _exercise_in(lesson: Lesson, exercise_id: int) -> Exercise:
        exercise = next((e for e in lesson.exercises if e.id == exercise_id), None)
        if exercise is None:
            raise ExerciseNotFound(exercise_id=exercise_id, lesson_id=lesson.id)
        return exercise

    @staticmethod
    def _evaluate(exercise: Exercise, request: CheckAnswerIn) -> CheckResult:
        checker = get_checker(exercise.type)
        return checker.evaluate(exercise.content, exercise.solution, request.answer)

    def _response(
        self,
        user: User,
        lesson: Lesson,
        attempt: LessonAttempt,
        exercise: Exercise,
        submission_id: str,
        result: CheckResult,
    ) -> CheckAnswerOut:
        solved = self._attempts.solved_exercise_ids(attempt.id)
        total = len(lesson.exercises)
        mistakes = self._attempts.mistakes(attempt.id)
        reveal: ExerciseModel | None = result.reveal
        assert reveal is not None  # always attached by ExerciseChecker.evaluate()
        return CheckAnswerOut(
            submission_id=submission_id,
            exercise_id=exercise.id,
            is_correct=result.is_correct,
            heart_lost=not result.is_correct and challenge.MODE_RULES[attempt.mode].costs_hearts,
            correct_answer=result.correct_answer,
            reveal=reveal,  # a member of RevealOut; Pydantic validates the variant
            note=result.note,
            explanation=exercise.explanation,
            hearts=self._hearts.view(user),
            attempt=AttemptProgressOut(
                status=attempt.status,
                solved_count=len(solved),
                total_exercises=total,
                mistakes=mistakes,
                mistakes_remaining=challenge.mistakes_remaining(attempt.mode, mistakes),
                can_complete=len(solved) == total,
            ),
        )

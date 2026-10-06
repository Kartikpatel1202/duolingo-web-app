"""Completing a lesson attempt: the only place XP, gems, streak and skill milestones change.

Idempotency, in three layers:
1. a completed attempt short-circuits to a rebuilt result (no writes);
2. UNIQUE(user_id, lesson_id) on user_lesson_progress — completion XP at most once per lesson;
3. UNIQUE(lesson_attempt_id, source) on xp_events — each XP source at most once per attempt.
All writes happen in one transaction; a constraint violation from a concurrent duplicate request
rolls it back and the request is answered from the winner's stored result.
"""

from sqlalchemy.exc import IntegrityError

from app.domain import streak as streak_rules
from app.domain import unlocks
from app.domain import xp as xp_rules
from app.domain.enums import AttemptStatus
from app.domain.errors import LessonNotFinished
from app.domain.rules import FIRST_COMPLETION_GEMS
from app.models import Lesson, LessonAttempt, User, UserLessonProgress, UserSkillProgress
from app.repositories import AttemptRepository, ProgressRepository, XpRepository
from app.schemas.progress import (
    AchievementSummaryOut,
    CompleteLessonIn,
    CompleteLessonOut,
    XpAwardOut,
)
from app.services.achievement_service import AchievementService
from app.services.attempts import get_owned_attempt
from app.services.context import ServiceContext
from app.services.course_progress import CourseProgressService
from app.services.hearts_service import HeartsService
from app.services.stats_service import StatsService, streak_state
from app.services.xp_service import XpService


class CompletionService:
    def __init__(self, ctx: ServiceContext) -> None:
        self._ctx = ctx
        self._attempts = AttemptRepository(ctx.session)
        self._progress = ProgressRepository(ctx.session)
        self._xp_repo = XpRepository(ctx.session)
        self._course_progress = CourseProgressService(ctx)
        self._xp = XpService(ctx)
        self._achievements = AchievementService(ctx)
        self._hearts = HeartsService(ctx)
        self._stats = StatsService(ctx)

    def complete(self, user: User, lesson_id: int, request: CompleteLessonIn) -> CompleteLessonOut:
        lesson, _ = self._course_progress.require_unlocked_lesson(user.id, lesson_id)
        attempt = get_owned_attempt(self._attempts, user, lesson_id, request.attempt_id)

        if attempt.status is AttemptStatus.IN_PROGRESS:
            self._ensure_all_solved(lesson, attempt)
            try:
                self._apply_completion(user, lesson, attempt)
                self._ctx.session.commit()
            except IntegrityError:
                # A concurrent duplicate request completed this attempt first.
                self._ctx.session.rollback()
                stored = self._attempts.get(attempt.id)
                if stored is None or stored.status is not AttemptStatus.COMPLETED:
                    raise

        return self._result(user, lesson, attempt)

    # --- the state change -----------------------------------------------------------------------

    def _ensure_all_solved(self, lesson: Lesson, attempt: LessonAttempt) -> None:
        solved = self._attempts.solved_exercise_ids(attempt.id)
        unsolved = [exercise.id for exercise in lesson.exercises if exercise.id not in solved]
        if unsolved:
            raise LessonNotFinished(unsolved_exercise_ids=unsolved)

    def _apply_completion(self, user: User, lesson: Lesson, attempt: LessonAttempt) -> None:
        now = self._ctx.now()
        attempt.status = AttemptStatus.COMPLETED
        attempt.completed_at = now

        first_completion = self._progress.lesson_progress(user.id, lesson.id) is None
        if first_completion:
            self._ctx.session.add(
                UserLessonProgress(
                    user_id=user.id,
                    lesson_id=lesson.id,
                    first_attempt_id=attempt.id,
                    completed_at=now,
                )
            )
            awards = xp_rules.completion_awards(
                first_completion=True,
                lesson_xp=lesson.xp_reward,
                mistakes=self._attempts.mistakes(attempt.id),
            )
            self._xp.award(user.id, awards, earned_at=now, attempt_id=attempt.id)
            user.gems += FIRST_COMPLETION_GEMS
            self._record_skill_progress(user, lesson, attempt)

        # Any completion (first or replay) counts as activity for the streak.
        new_streak = streak_rules.record_activity(streak_state(user), self._ctx.today())
        user.current_streak = new_streak.current
        user.longest_streak = new_streak.longest
        user.last_activity_date = new_streak.last_activity_date

        self._ctx.session.flush()
        self._achievements.award_new(user, attempt.id)

    def _record_skill_progress(self, user: User, lesson: Lesson, attempt: LessonAttempt) -> None:
        skill = lesson.skill
        progress = self._progress.skill_progress(user.id, skill.id)
        if progress is None:
            progress = UserSkillProgress(
                user_id=user.id, skill_id=skill.id, started_at=attempt.completed_at
            )
            self._ctx.session.add(progress)
        completed = self._progress.completed_lesson_ids(user.id)
        lesson_ids = [skill_lesson.id for skill_lesson in skill.lessons]
        if progress.completed_at is None and unlocks.all_lessons_completed(lesson_ids, completed):
            progress.completed_at = attempt.completed_at

    # --- the response (rebuilt from stored facts, so repeated requests get the same body) ------

    def _result(self, user: User, lesson: Lesson, attempt: LessonAttempt) -> CompleteLessonOut:
        lesson_progress = self._progress.lesson_progress(user.id, lesson.id)
        first_completion = (
            lesson_progress is not None and lesson_progress.first_attempt_id == attempt.id
        )
        events = self._xp_repo.events_for_attempt(attempt.id)
        mistakes = self._attempts.mistakes(attempt.id)

        course_progress = self._course_progress.load(user.id, lesson.skill.unit.course_id)
        skill = course_progress.skill(lesson.skill_id)
        skill_milestone = self._progress.skill_progress(user.id, skill.id)
        completed_skill_here = (
            skill_milestone is not None
            and skill_milestone.completed_at is not None
            and skill_milestone.completed_at == attempt.completed_at
        )
        unlocked_skill_id = (
            course_progress.next_skill_id(skill.id) if completed_skill_here else None
        )
        current_skill = course_progress.current_skill()

        return CompleteLessonOut(
            attempt_id=attempt.id,
            lesson_id=lesson.id,
            first_completion=first_completion,
            xp_awarded=sum(event.amount for event in events),
            xp_breakdown=[XpAwardOut(source=e.source, amount=e.amount) for e in events],
            gems_awarded=FIRST_COMPLETION_GEMS if first_completion else 0,
            mistakes=mistakes,
            accuracy=xp_rules.accuracy(exercises=len(lesson.exercises), mistakes=mistakes),
            total_xp=self._stats.total_xp(user),
            gems=user.gems,
            daily=self._stats.daily(user),
            streak=self._stats.streak(user),
            hearts=self._hearts.view(user),
            skill_progress=course_progress.skill_progress_out(skill),
            unlocked_skill_id=unlocked_skill_id,
            next_lesson_id=course_progress.next_lesson_id(current_skill) if current_skill else None,
            new_achievements=[
                AchievementSummaryOut(
                    code=a.code, title=a.title, description=a.description, icon=a.icon
                )
                for a in self._achievements.earned_by_attempt(attempt.id)
            ],
        )

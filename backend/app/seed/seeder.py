"""Deterministic, idempotent seeding.

Running the seed again never duplicates anything:
* content, achievements and users are upserted by natural keys (slug, positions, code, username);
* existing learner state (hearts, streak, progress) is never overwritten;
* rival XP is generated once per week (skipped if the rival already has an entry this week);
* demo progress is only played if the learner has never started a lesson.

Demo progress is produced by playing lessons through the real services with a FixedClock set in
the past, so seeded data obeys exactly the same rules as real play.
"""

from collections.abc import Sequence
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from typing import Any, Protocol

from sqlalchemy import Engine, func, select
from sqlalchemy.orm import Session, sessionmaker

from app.core.clock import Clock, FixedClock
from app.core.config import Settings
from app.db.database import reset_schema
from app.domain.enums import ExerciseType, XpSource
from app.domain.exercises import get_checker
from app.domain.leaderboard import week_start
from app.domain.rules import MAX_HEARTS, STARTING_GEMS
from app.domain.xp import XpAward
from app.models import Achievement, Course, Exercise, Lesson, LessonAttempt, Skill, Unit, User
from app.repositories import XpRepository
from app.schemas.lesson import CheckAnswerIn
from app.schemas.progress import CompleteLessonIn
from app.seed.builder import build_lesson
from app.seed.people import ACHIEVEMENTS, LEARNER_AVATAR_COLOR, LEARNER_DISPLAY_NAME, RIVALS
from app.seed.spanish_course import SPANISH_COURSE
from app.seed.specs import CourseSpec
from app.services.answer_service import AnswerService
from app.services.completion_service import CompletionService
from app.services.context import ServiceContext
from app.services.lesson_service import LessonService
from app.services.xp_service import XpService


class _Positioned(Protocol):
    position: int


@dataclass(frozen=True)
class SeedReport:
    course_id: int
    lessons: int
    exercises: int
    users: int
    demo_progress_played: bool


def reset_and_seed(
    engine: Engine,
    session_factory: sessionmaker[Session],
    clock: Clock,
    settings: Settings,
    *,
    demo_progress: bool,
) -> SeedReport:
    """Development/test reset: drop every table, recreate, seed."""
    reset_schema(engine)
    return seed_database(session_factory, clock, settings, demo_progress=demo_progress)


def seed_database(
    session_factory: sessionmaker[Session],
    clock: Clock,
    settings: Settings,
    *,
    demo_progress: bool,
) -> SeedReport:
    with session_factory() as session:
        course = _upsert_course(session, SPANISH_COURSE)
        _upsert_achievements(session)
        now = clock.now()
        learner = _upsert_user(
            session,
            settings.default_username,
            LEARNER_DISPLAY_NAME,
            LEARNER_AVATAR_COLOR,
            course,
            now,
        )
        rivals = [
            _upsert_user(session, r.username, r.display_name, r.avatar_color, course, now, bot=True)
            for r in RIVALS
        ]
        session.commit()

        ctx = ServiceContext(session, clock, settings.timezone)
        _seed_rival_week(ctx, rivals)
        session.commit()

        played = False
        if demo_progress and not _has_attempts(session, learner):
            _play_demo_progress(session, settings, learner, course, ctx.today())
            played = True

        return SeedReport(
            course_id=course.id,
            lessons=session.scalar(select(func.count(Lesson.id))) or 0,
            exercises=session.scalar(select(func.count(Exercise.id))) or 0,
            users=session.scalar(select(func.count(User.id))) or 0,
            demo_progress_played=played,
        )


# --- content ---------------------------------------------------------------------------------


def _upsert_course(session: Session, spec: CourseSpec) -> Course:
    course = session.scalars(select(Course).where(Course.slug == spec.slug)).one_or_none()
    if course is None:
        course = Course(slug=spec.slug)
        session.add(course)
    course.title = spec.title
    course.learning_language = spec.learning_language
    course.from_language = spec.from_language
    course.description = spec.description

    for unit_position, unit_spec in enumerate(spec.units, start=1):
        unit = _child(course.units, unit_position) or Unit(position=unit_position)
        if unit not in course.units:
            course.units.append(unit)
        unit.title, unit.description, unit.theme = (
            unit_spec.title,
            unit_spec.description,
            unit_spec.theme,
        )

        for skill_position, skill_spec in enumerate(unit_spec.skills, start=1):
            skill = _child(unit.skills, skill_position) or Skill(position=skill_position)
            if skill not in unit.skills:
                unit.skills.append(skill)
            skill.title, skill.icon = skill_spec.title, skill_spec.icon
            skill.description = skill_spec.description

            for lesson_position, lesson_spec in enumerate(skill_spec.lessons, start=1):
                lesson = _child(skill.lessons, lesson_position) or Lesson(position=lesson_position)
                if lesson not in skill.lessons:
                    skill.lessons.append(lesson)
                lesson.title = lesson_spec.title
                key = f"{spec.slug}/{unit_position}/{skill_position}/{lesson_position}"
                for position, draft in enumerate(build_lesson(lesson_spec, key), start=1):
                    exercise = _child(lesson.exercises, position) or Exercise(position=position)
                    if exercise not in lesson.exercises:
                        lesson.exercises.append(exercise)
                    exercise.type = draft.type
                    exercise.prompt = draft.prompt
                    exercise.content = draft.content
                    exercise.solution = draft.solution
                    exercise.explanation = draft.explanation
    session.flush()
    return course


def _child(children: Sequence[_Positioned], position: int) -> Any:
    return next((child for child in children if child.position == position), None)


def _upsert_achievements(session: Session) -> None:
    existing = {a.code: a for a in session.scalars(select(Achievement))}
    for spec in ACHIEVEMENTS:
        achievement = existing.get(spec.code) or Achievement(code=spec.code)
        achievement.title, achievement.description = spec.title, spec.description
        achievement.icon, achievement.metric, achievement.threshold = (
            spec.icon,
            spec.metric,
            spec.threshold,
        )
        session.add(achievement)


# --- learners --------------------------------------------------------------------------------


def _upsert_user(
    session: Session,
    username: str,
    display_name: str,
    avatar_color: str,
    course: Course,
    now: datetime,
    *,
    bot: bool = False,
) -> User:
    user = session.scalars(select(User).where(User.username == username)).one_or_none()
    if user is not None:
        return user  # never overwrite an existing learner's state
    user = User(
        username=username,
        display_name=display_name,
        avatar_color=avatar_color,
        is_bot=bot,
        current_course_id=course.id,
        hearts=MAX_HEARTS,
        hearts_updated_at=now,
        gems=STARTING_GEMS,
        created_at=now,
    )
    session.add(user)
    session.flush()
    return user


def _seed_rival_week(ctx: ServiceContext, rivals: list[User]) -> None:
    """Give rivals deterministic XP for the current week, up to today (once per week)."""
    today = ctx.today()
    monday = week_start(today)
    xp_repository = XpRepository(ctx.session)
    xp_service = XpService(ctx)
    pace_by_username = {spec.username: spec.weekly_pace for spec in RIVALS}
    for rival in rivals:
        if xp_repository.get_entry(rival.id, monday) is not None:
            continue
        for offset in range((today - monday).days + 1):
            day = monday + timedelta(days=offset)
            earned_at = min(_local(day, time(12), ctx), ctx.now())
            amount = pace_by_username[rival.username][offset]
            xp_service.award(rival.id, [XpAward(XpSource.SEED, amount)], earned_at=earned_at)


# --- demo progress ---------------------------------------------------------------------------

# (days ago, local hour, unit, skill, lesson, mistake on the first exercise?)
_DEMO_PLAN = (
    (2, 18, 1, 1, 1, False),
    (1, 19, 1, 1, 2, True),
    (1, 20, 1, 2, 1, False),
)


def _play_demo_progress(
    session: Session, settings: Settings, learner: User, course: Course, today: date
) -> None:
    """Learner played on the two previous days: skill 1 completed, skill 2 started, a 2-day
    streak that can be extended today."""
    for days_ago, hour, unit_pos, skill_pos, lesson_pos, with_mistake in _DEMO_PLAN:
        played_at = datetime.combine(
            today - timedelta(days=days_ago), time(hour), tzinfo=settings.timezone
        )
        ctx = ServiceContext(session, FixedClock(played_at), settings.timezone)
        lesson = course.units[unit_pos - 1].skills[skill_pos - 1].lessons[lesson_pos - 1]
        _play_lesson(ctx, learner, lesson, with_mistake=with_mistake)


def _play_lesson(ctx: ServiceContext, learner: User, lesson: Lesson, *, with_mistake: bool) -> None:
    attempt, _ = LessonService(ctx).start_attempt(learner, lesson.id)
    answers = AnswerService(ctx)
    for exercise in lesson.exercises:
        checker = get_checker(exercise.type)
        content = checker.parse_content(exercise.content)
        solution = checker.parse_solution(exercise.solution)
        if (
            with_mistake
            and exercise.position == 1
            and exercise.type is ExerciseType.MULTIPLE_CHOICE
        ):
            wrong = next(o.id for o in content.options if o.id != solution.correct_option_id)
            answers.check(
                learner,
                lesson.id,
                CheckAnswerIn(
                    attempt_id=attempt.attempt_id,
                    exercise_id=exercise.id,
                    submission_id=f"seed-demo-{exercise.id:05d}-wrong",
                    answer=checker.answer_model(option_id=wrong),
                ),
            )
        answers.check(
            learner,
            lesson.id,
            CheckAnswerIn(
                attempt_id=attempt.attempt_id,
                exercise_id=exercise.id,
                submission_id=f"seed-demo-{exercise.id:05d}",
                answer=checker.sample_correct_answer(content, solution),
            ),
        )
    CompletionService(ctx).complete(
        learner, lesson.id, CompleteLessonIn(attempt_id=attempt.attempt_id)
    )


def _has_attempts(session: Session, user: User) -> bool:
    statement = select(func.count(LessonAttempt.id)).where(LessonAttempt.user_id == user.id)
    return (session.scalar(statement) or 0) > 0


def _local(day: date, at: time, ctx: ServiceContext) -> datetime:
    return datetime.combine(day, at, tzinfo=ctx.timezone)

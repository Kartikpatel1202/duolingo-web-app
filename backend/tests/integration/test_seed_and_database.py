from datetime import timedelta

import pytest
from fastapi import FastAPI
from sqlalchemy import func, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.clock import FixedClock
from app.core.config import Settings
from app.domain.enums import ExerciseType
from app.domain.exercises import get_checker
from app.models import (
    Achievement,
    Course,
    Exercise,
    LeaderboardEntry,
    Lesson,
    LessonAttempt,
    Skill,
    Unit,
    User,
    UserLessonProgress,
    XpEvent,
)
from app.seed.seeder import reset_and_seed, seed_database

ALL_TABLES = (Course, Unit, Skill, Lesson, Exercise, User, Achievement, XpEvent, LeaderboardEntry)


def counts(session: Session) -> dict[str, int]:
    return {
        model.__name__: session.scalar(select(func.count()).select_from(model)) or 0
        for model in ALL_TABLES
    }


# --- seed --------------------------------------------------------------------------------------


def test_seed_shape(db: Session) -> None:
    assert counts(db)["Course"] == 1
    units = db.scalars(select(Unit)).all()
    assert len(units) == 3
    for unit in units:
        assert len(unit.skills) >= 3
        for skill in unit.skills:
            assert len(skill.lessons) >= 2
            for lesson in skill.lessons:
                assert 5 <= len(lesson.exercises) <= 8


def test_seed_uses_every_exercise_type(db: Session) -> None:
    used = set(db.scalars(select(Exercise.type).distinct()).all())
    assert used == set(ExerciseType)


def test_every_seeded_exercise_is_valid(db: Session) -> None:
    for exercise in db.scalars(select(Exercise)):
        get_checker(exercise.type).validate_definition(exercise.content, exercise.solution)


def test_seed_is_idempotent(
    app: FastAPI, clock: FixedClock, settings: Settings, db: Session
) -> None:
    before = counts(db)
    seed_database(app.state.session_factory, clock, settings, demo_progress=False)
    seed_database(app.state.session_factory, clock, settings, demo_progress=False)
    db.expire_all()
    assert counts(db) == before


def test_seed_is_deterministic(app: FastAPI, clock: FixedClock, settings: Settings) -> None:
    def snapshot() -> list[tuple[object, ...]]:
        with app.state.session_factory() as session:
            rows = session.execute(
                select(Exercise.id, Exercise.type, Exercise.content, Exercise.solution)
            ).all()
            return [tuple(row) for row in rows]

    first = snapshot()
    reset_and_seed(
        app.state.engine, app.state.session_factory, clock, settings, demo_progress=False
    )
    assert snapshot() == first


def test_seed_creates_learner_rivals_and_rival_weekly_xp(db: Session) -> None:
    users = db.scalars(select(User)).all()
    learner = [u for u in users if not u.is_bot]
    assert [u.username for u in learner] == ["learner"]
    assert len(users) - 1 >= 5
    rivals_with_xp = db.scalar(select(func.count()).select_from(LeaderboardEntry)) or 0
    assert rivals_with_xp == len(users) - 1  # every rival has XP this week, the learner not yet


def test_demo_progress_is_played_once(
    app: FastAPI, clock: FixedClock, settings: Settings, db: Session
) -> None:
    seed_database(app.state.session_factory, clock, settings, demo_progress=True)
    seed_database(app.state.session_factory, clock, settings, demo_progress=True)
    assert db.scalar(select(func.count()).select_from(LessonAttempt)) == 3
    assert db.scalar(select(func.count()).select_from(UserLessonProgress)) == 3
    learner = db.scalars(select(User).where(User.username == "learner")).one()
    assert learner.current_streak == 2
    assert learner.last_activity_date == (clock.now() - timedelta(days=1)).date()


# --- database integrity -------------------------------------------------------------------------


def test_foreign_keys_are_enforced(db: Session) -> None:
    assert db.execute(text("PRAGMA foreign_keys")).scalar() == 1
    db.add(Lesson(skill_id=9999, position=1, title="orphan", xp_reward=10))
    with pytest.raises(IntegrityError):
        db.flush()


@pytest.mark.parametrize(
    "statement",
    [
        "UPDATE users SET hearts = 6",
        "UPDATE users SET hearts = -1",
        "UPDATE users SET gems = -5",
        "UPDATE users SET daily_goal_xp = 25",
        "UPDATE exercises SET type = 'drawing'",
        "UPDATE lessons SET xp_reward = 0",
    ],
)
def test_check_constraints_reject_invalid_state(db: Session, statement: str) -> None:
    with pytest.raises(IntegrityError):
        db.execute(text(statement))


def test_positions_are_unique_within_parent(db: Session) -> None:
    lesson = db.scalars(select(Lesson)).first()
    assert lesson is not None
    db.add(Lesson(skill_id=lesson.skill_id, position=lesson.position, xp_reward=10))
    with pytest.raises(IntegrityError):
        db.flush()


def test_content_with_learner_history_cannot_be_deleted(api, db: Session) -> None:  # type: ignore[no-untyped-def]
    api.play(api.lesson_id(1, 1, 1))
    with pytest.raises(IntegrityError):
        db.execute(text("DELETE FROM lessons WHERE id = 1"))


def test_deleting_a_learner_cascades_to_their_progress(api, db: Session) -> None:  # type: ignore[no-untyped-def]
    api.play(api.lesson_id(1, 1, 1))
    db.execute(text("DELETE FROM users WHERE username = 'learner'"))
    db.commit()
    for table in (
        "lesson_attempts",
        "attempt_answers",
        "user_lesson_progress",
        "user_skill_progress",
    ):
        assert db.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar() == 0

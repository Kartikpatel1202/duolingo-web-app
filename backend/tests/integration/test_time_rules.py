"""Streak, daily XP, heart regeneration and weekly leaderboard — driven by moving the FixedClock."""

from datetime import timedelta

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.clock import FixedClock
from app.core.config import Settings
from app.main import create_app
from app.models import LeaderboardEntry, User, XpEvent
from app.seed.seeder import reset_and_seed
from tests.conftest import NOW
from tests.helpers import Api, wrong_answer

DAY = timedelta(days=1)


def learner(db: Session) -> User:
    db.expire_all()
    return db.scalars(select(User).where(User.username == "learner")).one()


# --- streak ---------------------------------------------------------------------------------------


def test_streak_grows_on_consecutive_days(api: Api, clock: FixedClock) -> None:
    assert api.play(api.lesson_id(1, 1, 1))["streak"]["current"] == 1
    clock.advance(DAY)
    assert api.get("/api/users/me")["streak"] == {"current": 1, "longest": 1, "active_today": False}
    assert api.play(api.lesson_id(1, 1, 2))["streak"]["current"] == 2
    # A second lesson on the same day does not change it.
    assert api.play(api.lesson_id(1, 2, 1))["streak"] == {
        "current": 2,
        "longest": 2,
        "active_today": True,
    }


def test_missed_day_shows_zero_without_mutating_and_resets_on_next_lesson(
    api: Api, clock: FixedClock, db: Session
) -> None:
    api.play(api.lesson_id(1, 1, 1))
    clock.advance(DAY)
    api.play(api.lesson_id(1, 1, 2))
    clock.advance(3 * DAY)

    assert api.get("/api/users/me")["streak"] == {"current": 0, "longest": 2, "active_today": False}
    assert learner(db).current_streak == 2  # reads never write the streak

    assert api.play(api.lesson_id(1, 2, 1))["streak"] == {
        "current": 1,
        "longest": 2,
        "active_today": True,
    }


def test_streak_day_boundary_follows_app_timezone(settings: Settings) -> None:
    """In Asia/Kolkata (UTC+05:30), 20:00 UTC and 17:00 UTC the next day are consecutive days."""
    clock = FixedClock(NOW.replace(hour=17))  # 22:30 in Kolkata, Oct 7
    kolkata = settings.model_copy(update={"app_timezone": "Asia/Kolkata"})
    app = create_app(kolkata, clock)
    reset_and_seed(app.state.engine, app.state.session_factory, clock, kolkata, demo_progress=False)
    with TestClient(app) as client:
        api = Api(client, app.state.session_factory)
        api.play(api.lesson_id(1, 1, 1))
        clock.advance(timedelta(hours=2))  # 00:30 Oct 8 in Kolkata — a new learning day
        assert api.play(api.lesson_id(1, 1, 2))["streak"]["current"] == 2


# --- daily XP -------------------------------------------------------------------------------------


def test_daily_xp_is_per_learning_day(api: Api, clock: FixedClock) -> None:
    api.play(api.lesson_id(1, 1, 1))
    result = api.play(api.lesson_id(1, 1, 2))
    assert result["daily"] == {"daily_xp": 30, "daily_goal": 20, "daily_goal_completed": True}

    clock.advance(DAY)
    me = api.get("/api/users/me")
    assert me["daily"] == {"daily_xp": 0, "daily_goal": 20, "daily_goal_completed": False}
    assert me["total_xp"] == 30


# --- hearts ---------------------------------------------------------------------------------------


def test_hearts_regenerate_over_time(api: Api, clock: FixedClock, db: Session) -> None:
    lesson_id = api.lesson_id(1, 1, 1)
    attempt_id = api.start(lesson_id).json()["attempt_id"]
    exercise = api.exercises(lesson_id)[0]
    for _ in range(3):
        api.check(lesson_id, attempt_id, exercise, wrong_answer(exercise))
    assert api.get("/api/hearts")["current"] == 2

    clock.advance(timedelta(minutes=31))
    hearts = api.get("/api/hearts")
    assert hearts["current"] == 3
    assert hearts["next_heart_at"] == "2026-10-07T11:00:00Z"
    assert learner(db).hearts == 2  # computed on read, persisted on the next change

    clock.advance(timedelta(hours=5))
    assert api.get("/api/hearts") | {"next_heart_at": None} == api.get("/api/hearts")
    assert api.get("/api/hearts")["current"] == 5


def test_refill_hearts(api: Api) -> None:
    lesson_id = api.lesson_id(1, 1, 1)
    attempt_id = api.start(lesson_id).json()["attempt_id"]
    exercise = api.exercises(lesson_id)[0]
    api.check(lesson_id, attempt_id, exercise, wrong_answer(exercise))

    response = api.client.post("/api/hearts/refill")
    assert response.status_code == 200
    assert response.json()["hearts"]["current"] == 5
    assert response.json()["gems"] == 450

    again = api.client.post("/api/hearts/refill")
    assert again.status_code == 409
    assert again.json()["error"]["code"] == "HEARTS_FULL"
    assert api.get("/api/users/me")["gems"] == 450


def test_refill_requires_enough_gems(api: Api, db: Session) -> None:
    user = learner(db)
    user.gems, user.hearts = 49, 0
    db.commit()
    response = api.client.post("/api/hearts/refill")
    assert response.status_code == 409
    assert response.json()["error"] == {
        "code": "INSUFFICIENT_GEMS",
        "message": "You do not have enough gems.",
        "details": {"required": 50, "available": 49},
    }


# --- leaderboard ----------------------------------------------------------------------------------


def test_leaderboard_includes_current_learner_and_rivals(api: Api) -> None:
    board = api.get("/api/leaderboard")
    assert board["week_start"] == "2026-10-05"
    assert board["resets_at"] == "2026-10-12T00:00:00Z"
    assert len(board["entries"]) == 10
    xp = [row["xp"] for row in board["entries"]]
    assert xp == sorted(xp, reverse=True)
    me = [row for row in board["entries"] if row["is_current_user"]]
    assert me == [{**me[0], "xp": 0, "rank": 10}]
    assert board["current_user"] == {"rank": 10, "xp": 0}


def test_leaderboard_updates_after_earning_xp(api: Api) -> None:
    for skill, lesson in ((1, 1), (1, 2), (2, 1)):
        api.play(api.lesson_id(1, skill, lesson))
    board = api.get("/api/leaderboard")
    me = board["current_user"]
    assert me["xp"] == 45
    ahead = [row for row in board["entries"] if row["xp"] > me["xp"]]
    assert me["rank"] == len(ahead) + 1 < 10


def test_leaderboard_limit(api: Api) -> None:
    board = api.get("/api/leaderboard?limit=3")
    assert [row["rank"] for row in board["entries"]] == [1, 2, 3]
    assert board["current_user"]["rank"] == 10


def test_new_week_resets_standings_without_emptying_the_board(api: Api, clock: FixedClock) -> None:
    api.play(api.lesson_id(1, 1, 1))
    clock.advance(5 * DAY)  # Monday 2026-10-12
    board = api.get("/api/leaderboard")
    assert board["week_start"] == "2026-10-12"
    assert len(board["entries"]) == 10
    assert {row["xp"] for row in board["entries"]} == {0}
    assert api.get("/api/users/me")["total_xp"] == 15  # history is kept

    api.play(api.lesson_id(1, 1, 2))
    board = api.get("/api/leaderboard")
    assert board["entries"][0]["is_current_user"] is True
    assert board["current_user"] == {"rank": 1, "xp": 15}


def test_leaderboard_cache_matches_the_xp_ledger(api: Api, clock: FixedClock, app: FastAPI) -> None:
    api.play(api.lesson_id(1, 1, 1))
    clock.advance(DAY)
    api.play(api.lesson_id(1, 1, 2), mistakes=1)
    clock.advance(6 * DAY)
    api.play(api.lesson_id(1, 2, 1))

    with app.state.session_factory() as session:
        for entry in session.scalars(select(LeaderboardEntry)):
            ledger = session.scalar(
                select(func.sum(XpEvent.amount)).where(
                    XpEvent.user_id == entry.user_id,
                    XpEvent.earned_on >= entry.week_start,
                    XpEvent.earned_on < entry.week_start + 7 * DAY,
                )
            )
            assert entry.xp == ledger


def test_profile(api: Api) -> None:
    api.play(api.lesson_id(1, 1, 1))
    api.play(api.lesson_id(1, 1, 1))  # replay: no duplicate achievements
    profile = api.get("/api/profile")
    assert profile["user"]["username"] == "learner"
    assert profile["stats"] == {
        "total_xp": 15,
        "current_streak": 1,
        "longest_streak": 1,
        "lessons_completed": 1,
        "skills_completed": 0,
        "weekly_xp": 15,
        "league_rank": profile["stats"]["league_rank"],
    }
    earned = {a["code"] for a in profile["achievements"] if a["earned_at"]}
    assert earned == {"first_lesson", "perfect_1"}
    century = next(a for a in profile["achievements"] if a["code"] == "xp_100")
    assert century["progress"] == 15 and century["threshold"] == 100

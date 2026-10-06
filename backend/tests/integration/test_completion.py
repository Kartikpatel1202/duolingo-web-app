from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import UserLessonProgress, XpEvent
from tests.helpers import Api, correct_answer


def total_xp(api: Api) -> int:
    return int(api.get("/api/users/me")["total_xp"])


def test_cannot_complete_before_every_exercise_is_solved(api: Api) -> None:
    lesson_id = api.lesson_id(1, 1, 1)
    attempt_id = api.start(lesson_id).json()["attempt_id"]
    exercises = api.exercises(lesson_id)
    api.check(lesson_id, attempt_id, exercises[0], correct_answer(exercises[0]))

    response = api.complete(lesson_id, attempt_id)
    assert response.status_code == 409
    error = response.json()["error"]
    assert error["code"] == "LESSON_NOT_FINISHED"
    assert error["details"]["unsolved_exercise_ids"] == [e.id for e in exercises[1:]]
    assert total_xp(api) == 0


def test_perfect_first_completion(api: Api) -> None:
    result = api.play(api.lesson_id(1, 1, 1))
    assert result["first_completion"] is True
    assert result["xp_awarded"] == 15
    assert result["xp_breakdown"] == [
        {"source": "lesson_completion", "amount": 10},
        {"source": "perfect_bonus", "amount": 5},
    ]
    assert result["gems_awarded"] == 5 and result["gems"] == 505
    assert result["mistakes"] == 0 and result["accuracy"] == 1.0
    assert result["total_xp"] == 15
    assert result["daily"] == {"daily_xp": 15, "daily_goal": 20, "daily_goal_completed": False}
    assert result["streak"] == {"current": 1, "longest": 1, "active_today": True}
    assert result["skill_progress"] == {
        "skill_id": 1,
        "status": "in_progress",
        "lessons_completed": 1,
        "total_lessons": 2,
        "progress": 0.5,
    }
    assert result["unlocked_skill_id"] is None
    assert result["next_lesson_id"] == api.lesson_id(1, 1, 2)
    assert {a["code"] for a in result["new_achievements"]} == {"first_lesson", "perfect_1"}


def test_completion_with_mistakes_earns_no_bonus(api: Api) -> None:
    result = api.play(api.lesson_id(1, 1, 1), mistakes=2)
    assert result["xp_awarded"] == 10
    assert result["mistakes"] == 2
    assert result["hearts"]["current"] == 3


def test_duplicate_completion_is_idempotent(api: Api, db: Session) -> None:
    lesson_id = api.lesson_id(1, 1, 1)
    first = api.play(lesson_id)
    again = api.complete(lesson_id, first["attempt_id"])
    third = api.complete(lesson_id, first["attempt_id"])

    assert again.status_code == third.status_code == 200
    assert again.json() == first == third.json()
    assert total_xp(api) == 15
    assert db.scalar(select(func.count()).select_from(XpEvent).where(XpEvent.user_id == 1)) == 2
    assert db.scalar(select(func.count()).select_from(UserLessonProgress)) == 1


def test_replaying_a_completed_lesson_awards_no_xp_but_counts_for_the_streak(api: Api) -> None:
    lesson_id = api.lesson_id(1, 1, 1)
    first = api.play(lesson_id)
    replay = api.play(lesson_id)

    assert replay["attempt_id"] != first["attempt_id"]
    assert replay["first_completion"] is False
    assert replay["xp_awarded"] == 0 and replay["xp_breakdown"] == []
    assert replay["gems_awarded"] == 0
    assert replay["new_achievements"] == []
    assert replay["total_xp"] == 15
    assert replay["streak"]["active_today"] is True


def test_completing_the_last_lesson_completes_the_skill_and_unlocks_the_next(api: Api) -> None:
    api.play(api.lesson_id(1, 1, 1))
    result = api.play(api.lesson_id(1, 1, 2))

    assert result["skill_progress"]["status"] == "completed"
    assert result["skill_progress"]["progress"] == 1.0
    assert result["unlocked_skill_id"] == 2
    assert result["next_lesson_id"] == api.lesson_id(1, 2, 1)
    assert "skill_1" in {a["code"] for a in result["new_achievements"]}

    skills = [s for u in api.get("/api/courses/1/path")["units"] for s in u["skills"]]
    assert [s["status"] for s in skills[:3]] == ["completed", "available", "locked"]
    assert api.start(api.lesson_id(1, 2, 1)).status_code == 201

    # Re-asking for the same completion still reports the unlock (idempotent body).
    repeated = api.complete(api.lesson_id(1, 1, 2), result["attempt_id"]).json()
    assert repeated["unlocked_skill_id"] == 2


def test_unlocks_cross_unit_boundaries(api: Api) -> None:
    for skill in (1, 2, 3):
        for lesson in (1, 2):
            api.play(api.lesson_id(1, skill, lesson))
    path = api.get("/api/courses/1/path")
    assert path["units"][1]["skills"][0]["status"] == "available"
    assert path["current_lesson_id"] == api.lesson_id(2, 1, 1)


def test_complete_with_an_attempt_from_another_lesson(api: Api) -> None:
    first = api.play(api.lesson_id(1, 1, 1))
    response = api.complete(api.lesson_id(1, 1, 2), first["attempt_id"])
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "ATTEMPT_INVALID"


def test_cannot_complete_a_locked_lesson(api: Api) -> None:
    response = api.complete(api.lesson_id(1, 2, 1), "whatever-attempt")
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "LESSON_LOCKED"


def test_progress_summary(api: Api) -> None:
    api.play(api.lesson_id(1, 1, 1))
    api.play(api.lesson_id(1, 1, 2), mistakes=1)
    progress: dict[str, Any] = api.get("/api/progress")
    assert progress["total_xp"] == 25
    assert progress["lessons_completed"] == 2
    assert progress["skills_completed"] == 1
    assert progress["courses"] == [
        {
            "course_id": 1,
            "lessons_completed": 2,
            "total_lessons": 18,
            "skills_completed": 1,
            "total_skills": 9,
            "progress": 0.1111,
        }
    ]
    assert progress["last_7_days"][-1] == {"date": "2026-10-07", "xp": 25}
    assert len(progress["last_7_days"]) == 7

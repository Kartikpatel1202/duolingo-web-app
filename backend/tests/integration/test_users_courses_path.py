from fastapi.testclient import TestClient

from tests.helpers import TOTAL_LESSONS, TOTAL_SKILLS, UNITS, Api


def test_current_user_for_a_fresh_learner(api: Api) -> None:
    me = api.get("/api/users/me")
    assert me["username"] == "learner"
    assert me["total_xp"] == 0
    assert me["gems"] == 500
    assert me["hearts"] == {
        "current": 5,
        "max": 5,
        "next_heart_at": None,
        "regen_minutes": 30,
        "refill_cost_gems": 50,
    }
    assert me["streak"] == {"current": 0, "longest": 0, "active_today": False}
    assert me["daily"] == {"daily_xp": 0, "daily_goal": 20, "daily_goal_completed": False}


def test_update_daily_goal(client: TestClient) -> None:
    response = client.patch("/api/users/me", json={"daily_goal_xp": 30})
    assert response.status_code == 200
    assert response.json()["daily"]["daily_goal"] == 30
    assert client.get("/api/users/me").json()["daily"]["daily_goal"] == 30


def test_daily_goal_must_be_an_allowed_option(client: TestClient) -> None:
    response = client.patch("/api/users/me", json={"daily_goal_xp": 25})
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_list_and_get_course(api: Api) -> None:
    courses = api.get("/api/courses")["courses"]
    assert [c["slug"] for c in courses] == ["es-en"]
    detail = api.get(f"/api/courses/{courses[0]['id']}")
    assert detail["unit_count"] == UNITS
    assert detail["skill_count"] == TOTAL_SKILLS
    assert detail["lesson_count"] == TOTAL_LESSONS
    assert detail["completed_lesson_count"] == 0


def test_fresh_path_opens_only_the_first_skill_of_each_unit(api: Api) -> None:
    path = api.get("/api/courses/1/path")
    skills = [skill for unit in path["units"] for skill in unit["skills"]]
    # "Jump here": every unit can be started; the rest of each unit unlocks skill by skill.
    per_unit = ["available"] + ["locked"] * (TOTAL_SKILLS // UNITS - 1)
    assert [s["status"] for s in skills] == per_unit * UNITS
    first = skills[0]
    assert path["current_skill_id"] == first["id"]
    assert path["current_lesson_id"] == first["next_lesson_id"] == api.lesson_id(1, 1, 1)
    assert first["lessons_completed"] == 0 and first["total_lessons"] == 2
    # A locked skill offers no lesson; an open one offers its first.
    assert all((s["next_lesson_id"] is None) == (s["status"] == "locked") for s in skills[1:])
    assert [u["theme"] for u in path["units"]] == [
        "lime",
        "purple",
        "teal",
        "lime",
        "sky",
        "pink",
        "lime",
        "ember",
        "cherry",
        "lime",
    ]
    assert [(u["section"], u["position"]) for u in path["units"]] == [
        (1, n) for n in range(1, UNITS + 1)
    ]
    assert {s["icon"] for s in skills} == {"star", "book", "headphones", "dumbbell"}
    assert {s["icon"] for s in path["units"][0]["skills"]} == {"star"}


def test_path_reflects_progress(api: Api) -> None:
    api.play(api.lesson_id(1, 1, 1))
    skills = [s for u in api.get("/api/courses/1/path")["units"] for s in u["skills"]]
    assert skills[0]["status"] == "in_progress"
    assert skills[0]["progress"] == 0.5
    assert skills[0]["next_lesson_id"] == api.lesson_id(1, 1, 2)
    assert skills[1]["status"] == "locked"


def test_skill_detail_lists_lessons_with_status(api: Api) -> None:
    skill = api.get("/api/skills/1")
    assert skill["status"] == "available"
    assert [lesson["status"] for lesson in skill["lessons"]] == ["available", "locked"]
    assert all(5 <= lesson["exercise_count"] <= 8 for lesson in skill["lessons"])
    assert not any(lesson["legendary"] for lesson in skill["lessons"])

    locked = api.get("/api/skills/2")
    assert locked["status"] == "locked"
    assert {lesson["status"] for lesson in locked["lessons"]} == {"locked"}


def test_unknown_skill(client: TestClient) -> None:
    response = client.get("/api/skills/999")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "SKILL_NOT_FOUND"

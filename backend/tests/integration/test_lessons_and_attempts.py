import json

from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.orm import Session

from tests.helpers import Api, correct_answer

FORBIDDEN_KEYS = {"solution", "accepted", "correct_option_id", "pairs", "correct_answer", "answer"}


def all_keys(value: object) -> set[str]:
    if isinstance(value, dict):
        return set(value) | {k for v in value.values() for k in all_keys(v)}
    if isinstance(value, list):
        return {k for item in value for k in all_keys(item)}
    return set()


# --- GET lesson -----------------------------------------------------------------------------------


def test_get_available_lesson(api: Api) -> None:
    lesson = api.get(f"/api/lessons/{api.lesson_id(1, 1, 1)}")
    assert lesson["xp_reward"] == 10
    assert [e["position"] for e in lesson["exercises"]] == list(range(1, 8))
    assert {e["type"] for e in lesson["exercises"]} == {
        "multiple_choice",
        "word_bank",
        "match_pairs",
        "fill_blank",
        "type_answer",
    }


def test_lesson_response_never_contains_solutions(api: Api, db: Session) -> None:
    """Security: the browser receives what it needs to render, never what it needs to cheat."""
    body = api.get(f"/api/lessons/{api.lesson_id(1, 1, 1)}")
    assert not all_keys(body) & FORBIDDEN_KEYS

    for exercise in body["exercises"]:
        assert set(exercise) == {"id", "position", "prompt", "type", "content"}
        raw = db.execute(
            text("SELECT solution FROM exercises WHERE id = :id"), {"id": exercise["id"]}
        ).scalar_one()
        solution = json.loads(raw) if isinstance(raw, str) else raw
        payload = json.dumps(exercise, ensure_ascii=False)
        if exercise["type"] == "type_answer":
            assert not any(accepted in payload for accepted in solution["accepted"])
        if exercise["type"] == "fill_blank":
            # The blanked word is offered as one of several options, never singled out.
            assert solution["accepted"][0] in exercise["content"]["options"]
            assert len(exercise["content"]["options"]) > 1
        if exercise["type"] == "match_pairs":
            # The right column is shuffled, so position does not reveal the pairing.
            positional = {f"l{i}": f"r{i}" for i in range(1, 5)}
            assert solution["pairs"] != positional


def test_locked_lesson_is_forbidden(client: TestClient, api: Api) -> None:
    for lesson_id in (api.lesson_id(1, 1, 2), api.lesson_id(1, 2, 1)):
        response = client.get(f"/api/lessons/{lesson_id}")
        assert response.status_code == 403
        assert response.json()["error"]["code"] == "LESSON_LOCKED"


def test_unknown_lesson(client: TestClient) -> None:
    response = client.get("/api/lessons/9999")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "LESSON_NOT_FOUND"


# --- attempts -------------------------------------------------------------------------------------


def test_start_attempt_creates_then_resumes(api: Api) -> None:
    lesson_id = api.lesson_id(1, 1, 1)
    created = api.start(lesson_id)
    assert created.status_code == 201
    body = created.json()
    assert body["status"] == "in_progress"
    assert body["solved_exercise_ids"] == []
    assert body["total_exercises"] == 7

    resumed = api.start(lesson_id)
    assert resumed.status_code == 200
    assert resumed.json()["attempt_id"] == body["attempt_id"]


def test_resumed_attempt_reports_progress_after_a_refresh(api: Api) -> None:
    lesson_id = api.lesson_id(1, 1, 1)
    attempt_id = api.start(lesson_id).json()["attempt_id"]
    first, second = api.exercises(lesson_id)[:2]
    api.check(lesson_id, attempt_id, first, correct_answer(first))
    api.check(lesson_id, attempt_id, second, correct_answer(second))

    resumed = api.start(lesson_id).json()
    assert resumed["attempt_id"] == attempt_id
    assert resumed["solved_exercise_ids"] == [first.id, second.id]


def test_replaying_a_completed_lesson_starts_a_new_attempt(api: Api) -> None:
    lesson_id = api.lesson_id(1, 1, 1)
    first = api.play(lesson_id)
    replay = api.start(lesson_id)
    assert replay.status_code == 201
    assert replay.json()["attempt_id"] != first["attempt_id"]


def test_cannot_start_a_locked_lesson(api: Api) -> None:
    response = api.start(api.lesson_id(2, 1, 1))
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "LESSON_LOCKED"


def test_cannot_start_a_lesson_without_hearts(api: Api, db: Session) -> None:
    db.execute(text("UPDATE users SET hearts = 0, hearts_updated_at = '2026-10-07 09:59:00'"))
    db.commit()
    response = api.start(api.lesson_id(1, 1, 1))
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "OUT_OF_HEARTS"

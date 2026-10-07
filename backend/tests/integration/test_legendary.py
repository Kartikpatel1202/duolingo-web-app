"""Legendary challenge: a timed, mistake-capped replay of a completed lesson (server-validated)."""

from datetime import timedelta
from typing import Any

import pytest

from app.core.clock import FixedClock
from tests.helpers import Api, correct_answer, wrong_answer


def start_legendary(api: Api, lesson_id: int) -> Any:
    return api.client.post(f"/api/lessons/{lesson_id}/attempts", json={"mode": "legendary"})


@pytest.fixture
def lesson_id(api: Api) -> int:
    lesson = api.lesson_id(1, 1, 1)
    api.play(lesson)
    return lesson


def test_legendary_requires_a_completed_lesson(api: Api) -> None:
    response = start_legendary(api, api.lesson_id(1, 1, 1))
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "LEGENDARY_LOCKED"


def test_legendary_attempt_has_a_deadline_and_a_mistake_cap(api: Api, lesson_id: int) -> None:
    response = start_legendary(api, lesson_id)
    assert response.status_code == 201
    body = response.json()
    assert body["mode"] == "legendary"
    assert body["expires_at"] == "2026-10-07T10:02:30Z"
    assert body["mistake_limit"] == 3
    # A standard attempt on the same lesson is separate and can coexist.
    standard = api.start(lesson_id).json()
    assert standard["mode"] == "standard"
    assert standard["attempt_id"] != body["attempt_id"]
    assert start_legendary(api, lesson_id).json()["attempt_id"] == body["attempt_id"]  # resumes


def test_legendary_mistakes_do_not_cost_hearts_and_the_third_ends_it(
    api: Api, lesson_id: int
) -> None:
    attempt_id = start_legendary(api, lesson_id).json()["attempt_id"]
    exercise = api.exercises(lesson_id)[0]
    remaining = []
    body: dict[str, Any] = {}
    for _ in range(3):
        body = api.check(lesson_id, attempt_id, exercise, wrong_answer(exercise)).json()
        assert body["heart_lost"] is False
        assert body["hearts"]["current"] == 5
        remaining.append(body["attempt"]["mistakes_remaining"])
    assert remaining == [2, 1, 0]
    assert body["attempt"]["status"] == "failed"

    blocked = api.check(lesson_id, attempt_id, exercise, correct_answer(exercise))
    assert blocked.status_code == 409
    assert blocked.json()["error"]["code"] == "ATTEMPT_FAILED"
    assert api.complete(lesson_id, attempt_id).json()["error"]["code"] == "ATTEMPT_FAILED"
    # A new challenge can be started.
    assert start_legendary(api, lesson_id).status_code == 201


def test_running_out_of_time_ends_the_challenge(
    api: Api, lesson_id: int, clock: FixedClock
) -> None:
    attempt_id = start_legendary(api, lesson_id).json()["attempt_id"]
    clock.advance(timedelta(seconds=151))
    exercise = api.exercises(lesson_id)[0]
    response = api.check(lesson_id, attempt_id, exercise, correct_answer(exercise))
    assert response.status_code == 409
    assert response.json()["error"]["details"]["reason"] == "time_up"
    # The expired attempt is not resumed: a fresh one starts.
    fresh = start_legendary(api, lesson_id)
    assert fresh.status_code == 201
    assert fresh.json()["attempt_id"] != attempt_id


def play_legendary(api: Api, lesson_id: int) -> dict[str, Any]:
    attempt_id = start_legendary(api, lesson_id).json()["attempt_id"]
    for exercise in api.exercises(lesson_id):
        response = api.check(lesson_id, attempt_id, exercise, correct_answer(exercise))
        assert response.status_code == 200
    completion = api.complete(lesson_id, attempt_id)
    assert completion.status_code == 200
    result: dict[str, Any] = completion.json()
    return result


def test_first_legendary_win_awards_a_one_time_bonus(api: Api, lesson_id: int) -> None:
    first = play_legendary(api, lesson_id)
    assert first["mode"] == "legendary"
    assert first["first_completion"] is False
    assert first["xp_breakdown"] == [{"source": "legendary_bonus", "amount": 20}]
    assert first["total_xp"] == 35

    again = play_legendary(api, lesson_id)
    assert again["xp_awarded"] == 0
    assert api.get("/api/users/me")["total_xp"] == 35


def test_legendary_status_is_reported_on_the_path(api: Api, lesson_id: int) -> None:
    second = api.lesson_id(1, 1, 2)
    api.play(second)
    play_legendary(api, lesson_id)
    skill = api.get("/api/skills/1")
    assert [lesson["legendary"] for lesson in skill["lessons"]] == [True, False]
    assert skill["legendary"] is False

    play_legendary(api, second)
    path_skill = api.get("/api/courses/1/path")["units"][0]["skills"][0]
    assert path_skill["legendary"] is True

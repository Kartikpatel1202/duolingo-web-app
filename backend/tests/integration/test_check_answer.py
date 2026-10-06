from typing import Any

import pytest
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import AttemptAnswer, Exercise
from tests.helpers import Api, correct_answer, wrong_answer


@pytest.fixture
def lesson_id(api: Api) -> int:
    return api.lesson_id(1, 1, 1)


@pytest.fixture
def attempt_id(api: Api, lesson_id: int) -> str:
    return str(api.start(lesson_id).json()["attempt_id"])


@pytest.fixture
def exercises(api: Api, lesson_id: int) -> list[Exercise]:
    return api.exercises(lesson_id)


def hearts(api: Api) -> int:
    return int(api.get("/api/hearts")["current"])


def error_code(response: Any) -> str:
    return str(response.json()["error"]["code"])


def test_correct_answer(
    api: Api, lesson_id: int, attempt_id: str, exercises: list[Exercise]
) -> None:
    exercise = exercises[0]
    response = api.check(lesson_id, attempt_id, exercise, correct_answer(exercise))
    assert response.status_code == 200
    body = response.json()
    assert body["is_correct"] is True
    assert body["hearts"]["current"] == 5
    assert body["attempt"] == {
        "solved_count": 1,
        "total_exercises": 7,
        "mistakes": 0,
        "can_complete": False,
    }


@pytest.mark.parametrize("index", range(7), ids=lambda i: f"exercise-{i + 1}")
def test_incorrect_answer_costs_one_heart_for_every_type(
    api: Api, lesson_id: int, attempt_id: str, exercises: list[Exercise], index: int
) -> None:
    exercise = exercises[index]
    response = api.check(lesson_id, attempt_id, exercise, wrong_answer(exercise))
    body = response.json()
    assert response.status_code == 200
    assert body["is_correct"] is False
    assert body["correct_answer"]  # revealed after checking, for the feedback sheet
    assert body["hearts"]["current"] == 4
    assert body["hearts"]["next_heart_at"] == "2026-10-07T10:30:00Z"
    assert body["attempt"]["mistakes"] == 1
    assert hearts(api) == 4


def test_retrying_the_same_submission_does_not_cost_another_heart(
    api: Api, lesson_id: int, attempt_id: str, exercises: list[Exercise], db: Session
) -> None:
    exercise = exercises[0]
    answer = wrong_answer(exercise)
    first = api.check(lesson_id, attempt_id, exercise, answer, submission_id="retry-0000001")
    retry = api.check(lesson_id, attempt_id, exercise, answer, submission_id="retry-0000001")
    assert retry.status_code == 200
    assert retry.json() == first.json()
    assert hearts(api) == 4
    stored = db.scalar(select(func.count()).select_from(AttemptAnswer))
    assert stored == 1


def test_reusing_a_submission_id_for_a_different_answer_is_rejected(
    api: Api, lesson_id: int, attempt_id: str, exercises: list[Exercise]
) -> None:
    exercise = exercises[0]
    api.check(lesson_id, attempt_id, exercise, wrong_answer(exercise), submission_id="reuse-000001")
    response = api.check(
        lesson_id, attempt_id, exercise, correct_answer(exercise), submission_id="reuse-000001"
    )
    assert response.status_code == 409
    assert error_code(response) == "DUPLICATE_SUBMISSION"
    assert hearts(api) == 4


def test_new_submission_after_a_mistake_can_be_correct(
    api: Api, lesson_id: int, attempt_id: str, exercises: list[Exercise]
) -> None:
    exercise = exercises[0]
    api.check(lesson_id, attempt_id, exercise, wrong_answer(exercise))
    response = api.check(lesson_id, attempt_id, exercise, correct_answer(exercise))
    assert response.json()["is_correct"] is True
    assert response.json()["attempt"]["mistakes"] == 1


def test_already_solved_exercise_is_rejected(
    api: Api, lesson_id: int, attempt_id: str, exercises: list[Exercise]
) -> None:
    exercise = exercises[0]
    api.check(lesson_id, attempt_id, exercise, correct_answer(exercise))
    response = api.check(lesson_id, attempt_id, exercise, wrong_answer(exercise))
    assert response.status_code == 409
    assert error_code(response) == "EXERCISE_ALREADY_SOLVED"
    assert hearts(api) == 5


def test_exercise_from_another_lesson_is_rejected(
    api: Api, lesson_id: int, attempt_id: str
) -> None:
    foreign = api.exercises(api.lesson_id(1, 1, 2))[0]
    response = api.check(lesson_id, attempt_id, foreign, correct_answer(foreign))
    assert response.status_code == 404
    assert error_code(response) == "EXERCISE_NOT_FOUND"


def test_attempt_of_another_lesson_is_rejected(
    api: Api, attempt_id: str, exercises: list[Exercise]
) -> None:
    other_lesson = api.lesson_id(1, 1, 2)
    response = api.check(other_lesson, attempt_id, exercises[0], correct_answer(exercises[0]))
    assert response.status_code == 409
    assert error_code(response) == "ATTEMPT_INVALID"


def test_unknown_attempt(api: Api, lesson_id: int, exercises: list[Exercise]) -> None:
    response = api.check(lesson_id, "does-not-exist", exercises[0], correct_answer(exercises[0]))
    assert response.status_code == 404
    assert error_code(response) == "ATTEMPT_NOT_FOUND"


def test_answer_of_the_wrong_type_is_invalid_and_free(
    api: Api, lesson_id: int, attempt_id: str, exercises: list[Exercise]
) -> None:
    multiple_choice = exercises[0]
    response = api.check(
        lesson_id, attempt_id, multiple_choice, {"type": "type_answer", "text": "hola"}
    )
    assert response.status_code == 422
    assert error_code(response) == "INVALID_ANSWER"
    assert hearts(api) == 5


def test_malformed_answer_is_invalid_and_free(
    api: Api, lesson_id: int, attempt_id: str, exercises: list[Exercise]
) -> None:
    response = api.check(
        lesson_id, attempt_id, exercises[0], {"type": "multiple_choice", "option_id": "zzz"}
    )
    assert response.status_code == 422
    assert error_code(response) == "INVALID_ANSWER"
    assert hearts(api) == 5


def test_zero_heart_boundary(
    api: Api, lesson_id: int, attempt_id: str, exercises: list[Exercise]
) -> None:
    exercise = exercises[0]
    for expected in (4, 3, 2, 1, 0):
        response = api.check(lesson_id, attempt_id, exercise, wrong_answer(exercise))
        assert response.status_code == 200
        assert response.json()["hearts"]["current"] == expected

    # At zero hearts, even a correct answer is refused and nothing is recorded or deducted.
    blocked = api.check(lesson_id, attempt_id, exercise, correct_answer(exercise))
    assert blocked.status_code == 409
    assert error_code(blocked) == "OUT_OF_HEARTS"
    assert hearts(api) == 0
    assert api.start(lesson_id).status_code == 409


def test_checking_a_completed_attempt_is_rejected(api: Api, lesson_id: int) -> None:
    completion = api.play(lesson_id)
    exercise = api.exercises(lesson_id)[0]
    response = api.check(lesson_id, completion["attempt_id"], exercise, correct_answer(exercise))
    assert response.status_code == 409
    assert error_code(response) == "ALREADY_COMPLETED"

"""Test helpers: an API driver that knows correct/incorrect answers for seeded exercises.

Answers are derived from the server-side solutions via each checker's `sample_correct_answer`,
so tests never depend on hard-coded content.
"""

import itertools
from typing import Any

from fastapi.testclient import TestClient
from httpx2 import Response
from sqlalchemy import select
from sqlalchemy.orm import Session, sessionmaker

from app.domain.enums import ExerciseType
from app.domain.exercises import get_checker
from app.models import Exercise, Lesson, Skill, Unit
from app.seed.people import LEARNER_EMAIL, LEARNER_PASSWORD

_submission_counter = itertools.count(1)


def new_submission_id() -> str:
    return f"submission-{next(_submission_counter):06d}"


def correct_answer(exercise: Exercise) -> dict[str, Any]:
    checker = get_checker(exercise.type)
    content = checker.parse_content(exercise.content)
    solution = checker.parse_solution(exercise.solution)
    sample = checker.sample_correct_answer(content, solution)
    answer: dict[str, Any] = sample.model_dump(mode="json")
    return answer


def wrong_answer(exercise: Exercise) -> dict[str, Any]:
    """A well-formed but incorrect answer for any exercise type."""
    answer = correct_answer(exercise)
    match exercise.type:
        case ExerciseType.MULTIPLE_CHOICE:
            options = [o["id"] for o in exercise.content["options"]]
            answer["option_id"] = next(o for o in options if o != answer["option_id"])
        case ExerciseType.WORD_BANK:
            answer["tile_ids"] = answer["tile_ids"][:-1]
        case ExerciseType.MATCH_PAIRS:
            rights = [pair["right_id"] for pair in answer["pairs"]]
            rotated = rights[1:] + rights[:1]
            answer["pairs"] = [
                {"left_id": pair["left_id"], "right_id": right}
                for pair, right in zip(answer["pairs"], rotated, strict=True)
            ]
        case ExerciseType.FILL_BLANK | ExerciseType.TYPE_ANSWER:
            answer["text"] = "definitely wrong"
    return answer


# Shape of the seeded course (Section 1): every unit has the same number of skills and lessons.
UNITS = 10
SKILLS_PER_UNIT = 4
LESSONS_PER_SKILL = 2
TOTAL_SKILLS = UNITS * SKILLS_PER_UNIT
TOTAL_LESSONS = TOTAL_SKILLS * LESSONS_PER_SKILL


def sign_in(client: TestClient) -> TestClient:
    """Log the seeded learner in through the real endpoint and keep the session on the client."""
    session = client.post(
        "/api/auth/login", json={"identifier": LEARNER_EMAIL, "password": LEARNER_PASSWORD}
    )
    assert session.status_code == 200, session.text
    client.headers["Authorization"] = f"Bearer {session.json()['token']}"
    return client


class Api:
    def __init__(self, client: TestClient, session_factory: sessionmaker[Session]) -> None:
        self.client = client
        self._session_factory = session_factory

    # --- content lookup -------------------------------------------------------------------------

    def lesson_id(self, unit: int, skill: int, lesson: int) -> int:
        with self._session_factory() as session:
            statement = (
                select(Lesson.id)
                .join(Skill, Lesson.skill_id == Skill.id)
                .join(Unit, Skill.unit_id == Unit.id)
                .where(Unit.position == unit, Skill.position == skill, Lesson.position == lesson)
            )
            return session.scalars(statement).one()

    def unit_lesson_ids(self, unit: int) -> list[int]:
        """Every lesson of a unit, in the order a learner has to play them."""
        with self._session_factory() as session:
            statement = (
                select(Lesson.id)
                .join(Skill, Lesson.skill_id == Skill.id)
                .join(Unit, Skill.unit_id == Unit.id)
                .where(Unit.position == unit)
                .order_by(Skill.position, Lesson.position)
            )
            return list(session.scalars(statement).all())

    def exercises(self, lesson_id: int) -> list[Exercise]:
        with self._session_factory() as session:
            statement = (
                select(Exercise).where(Exercise.lesson_id == lesson_id).order_by(Exercise.position)
            )
            return list(session.scalars(statement).all())

    # --- endpoints ------------------------------------------------------------------------------

    def start(self, lesson_id: int) -> Response:
        return self.client.post(f"/api/lessons/{lesson_id}/attempts")

    def check(
        self,
        lesson_id: int,
        attempt_id: str,
        exercise: Exercise,
        answer: dict[str, Any],
        submission_id: str | None = None,
    ) -> Response:
        return self.client.post(
            f"/api/lessons/{lesson_id}/check",
            json={
                "attempt_id": attempt_id,
                "exercise_id": exercise.id,
                "submission_id": submission_id or new_submission_id(),
                "answer": answer,
            },
        )

    def complete(self, lesson_id: int, attempt_id: str) -> Response:
        return self.client.post(
            f"/api/progress/lesson/{lesson_id}/complete", json={"attempt_id": attempt_id}
        )

    def play_unit(self, unit: int) -> None:
        """Finish a whole unit, lesson by lesson."""
        for lesson_id in self.unit_lesson_ids(unit):
            self.play(lesson_id)

    def play(self, lesson_id: int, *, mistakes: int = 0) -> dict[str, Any]:
        """Play a whole lesson: `mistakes` wrong answers on the first exercise, then all correct.
        Returns the completion response body."""
        start = self.start(lesson_id)
        assert start.status_code in (200, 201), start.text
        attempt_id = start.json()["attempt_id"]
        for index, exercise in enumerate(self.exercises(lesson_id)):
            if index == 0:
                for _ in range(mistakes):
                    response = self.check(lesson_id, attempt_id, exercise, wrong_answer(exercise))
                    assert response.json()["is_correct"] is False, response.text
            response = self.check(lesson_id, attempt_id, exercise, correct_answer(exercise))
            assert response.status_code == 200 and response.json()["is_correct"], response.text
        completion = self.complete(lesson_id, attempt_id)
        assert completion.status_code == 200, completion.text
        body: dict[str, Any] = completion.json()
        return body

    def get(self, path: str) -> Any:
        response = self.client.get(path)
        assert response.status_code == 200, response.text
        return response.json()

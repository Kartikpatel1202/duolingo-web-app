"""Test oracle for end-to-end tests. Only reachable when ENABLE_TEST_ROUTES=true.

Playwright drives the real UI and needs to know which answer is correct; this exposes each
exercise's sample correct answer (built by its checker) on a route that does not exist in normal
deployments, so the learner-facing API never carries solutions.
"""

from typing import Any

from app.domain.errors import LessonNotFound
from app.domain.exercises import get_checker
from app.repositories import ContentRepository
from app.services.context import ServiceContext


class TestSupportService:
    __test__ = False  # not a pytest test class

    def __init__(self, ctx: ServiceContext) -> None:
        self._content = ContentRepository(ctx.session)

    def answer_key(self, lesson_id: int) -> list[dict[str, Any]]:
        lesson = self._content.get_lesson(lesson_id)
        if lesson is None:
            raise LessonNotFound(lesson_id=lesson_id)
        key = []
        for exercise in lesson.exercises:
            checker = get_checker(exercise.type)
            answer = checker.sample_correct_answer(
                checker.parse_content(exercise.content), checker.parse_solution(exercise.solution)
            )
            key.append({"exercise_id": exercise.id, "answer": answer.model_dump(mode="json")})
        return key

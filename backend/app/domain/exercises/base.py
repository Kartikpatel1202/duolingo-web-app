"""The common checker interface (strategy pattern).

Each exercise type is one module that defines:

* a **Content** model — what the learner sees (sent to the client);
* a **Solution** model — what the server compares against (never sent to the client);
* an **Answer** model — what the client submits, discriminated by a `type` literal;
* a checker subclass implementing validation and checking for that type only.

`evaluate()` is the single entry point the lesson engine uses; it contains no type switches.
"""

import re
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, ClassVar, Generic, TypeVar

from pydantic import BaseModel, ConfigDict, ValidationError

from app.domain.enums import ExerciseType
from app.domain.errors import InvalidAnswer


class ExerciseModel(BaseModel):
    """Base for exercise payload models: immutable and strict about unknown fields."""

    model_config = ConfigDict(frozen=True, extra="forbid")


ContentT = TypeVar("ContentT", bound=ExerciseModel)
SolutionT = TypeVar("SolutionT", bound=ExerciseModel)
AnswerT = TypeVar("AnswerT", bound=ExerciseModel)


@dataclass(frozen=True)
class CheckResult:
    is_correct: bool
    correct_answer: str  # human-readable solution, shown in the feedback sheet
    note: str | None = None  # soft feedback, e.g. an accent reminder on an accepted answer


class ExerciseDefinitionError(ValueError):
    """Seeded content is inconsistent (e.g. the solution references an unknown option)."""


class ExerciseChecker(ABC, Generic[ContentT, SolutionT, AnswerT]):
    exercise_type: ClassVar[ExerciseType]
    content_model: type[ContentT]
    solution_model: type[SolutionT]
    answer_model: type[AnswerT]

    # --- parsing --------------------------------------------------------------------------------

    def parse_content(self, raw: dict[str, Any]) -> ContentT:
        return self.content_model.model_validate(raw)

    def parse_solution(self, raw: dict[str, Any]) -> SolutionT:
        return self.solution_model.model_validate(raw)

    def validate_definition(
        self, raw_content: dict[str, Any], raw_solution: dict[str, Any]
    ) -> None:
        """Seed-time validation: payload shapes and content/solution consistency."""
        try:
            content = self.parse_content(raw_content)
            solution = self.parse_solution(raw_solution)
        except ValidationError as exc:
            raise ExerciseDefinitionError(str(exc)) from exc
        self.check_definition(content, solution)

    # --- the lesson engine's entry point --------------------------------------------------------

    def evaluate(
        self, raw_content: dict[str, Any], raw_solution: dict[str, Any], answer: ExerciseModel
    ) -> CheckResult:
        if not isinstance(answer, self.answer_model):
            raise InvalidAnswer(
                "The answer type does not match the exercise type.",
                expected_type=self.exercise_type,
            )
        content = self.parse_content(raw_content)
        self.validate_answer(content, answer)
        return self.check(content, self.parse_solution(raw_solution), answer)

    # --- per-type behaviour ---------------------------------------------------------------------

    @abstractmethod
    def check_definition(self, content: ContentT, solution: SolutionT) -> None:
        """Raise ExerciseDefinitionError if content and solution are inconsistent."""

    @abstractmethod
    def validate_answer(self, content: ContentT, answer: AnswerT) -> None:
        """Raise InvalidAnswer if the answer is malformed for this content (unknown ids, etc.).
        A malformed answer is a client error, never a wrong answer: it must not cost a heart."""

    @abstractmethod
    def check(self, content: ContentT, solution: SolutionT, answer: AnswerT) -> CheckResult:
        """Decide correctness of a well-formed answer."""

    @abstractmethod
    def sample_correct_answer(self, content: ContentT, solution: SolutionT) -> AnswerT:
        """A correct answer, built from the solution. Server-side only (seed demo data, tests)."""


_SPACE_BEFORE_PUNCTUATION = re.compile(r"\s+([.,!?;:])")


def join_sentence(*parts: str) -> str:
    """Join sentence fragments with single spaces, without a space before punctuation."""
    sentence = " ".join(part.strip() for part in parts if part and part.strip())
    return _SPACE_BEFORE_PUNCTUATION.sub(r"\1", sentence)


def ensure_unique_ids(ids: list[str], what: str) -> None:
    if len(ids) != len(set(ids)):
        raise ExerciseDefinitionError(f"{what} ids must be unique.")

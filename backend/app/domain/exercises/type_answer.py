"""Type the answer: translate a sentence by typing it.

Correct iff the normalised text matches one of the accepted translations. Case, punctuation,
quote style and spacing are ignored; word order is not. A match that only differs in accents is
accepted with a note.
"""

from typing import Literal

from pydantic import Field

from app.domain.enums import ExerciseType
from app.domain.errors import InvalidAnswer
from app.domain.exercises.base import CheckResult, ExerciseChecker, ExerciseModel
from app.domain.text import MatchKind, match_text, normalize


class TypeAnswerContent(ExerciseModel):
    source_text: str = Field(min_length=1)
    source_language: str = Field(min_length=2, max_length=8)
    target_language: str = Field(min_length=2, max_length=8)


class TypeAnswerSolution(ExerciseModel):
    accepted: list[str] = Field(min_length=1)


class TypeAnswerAnswer(ExerciseModel):
    type: Literal["type_answer"] = "type_answer"
    text: str = Field(max_length=300)


class TypeAnswerChecker(ExerciseChecker[TypeAnswerContent, TypeAnswerSolution, TypeAnswerAnswer]):
    exercise_type = ExerciseType.TYPE_ANSWER
    content_model = TypeAnswerContent
    solution_model = TypeAnswerSolution
    answer_model = TypeAnswerAnswer

    def check_definition(self, content: TypeAnswerContent, solution: TypeAnswerSolution) -> None:
        return None  # any non-empty accepted list is consistent with any prompt

    def validate_answer(self, content: TypeAnswerContent, answer: TypeAnswerAnswer) -> None:
        if not normalize(answer.text):
            raise InvalidAnswer("The answer is empty.")

    def check(
        self, content: TypeAnswerContent, solution: TypeAnswerSolution, answer: TypeAnswerAnswer
    ) -> CheckResult:
        match = match_text(answer.text, solution.accepted)
        shown = match.matched or solution.accepted[0]
        note = (
            f"Watch your accents: {shown}" if match.kind is MatchKind.ACCENT_INSENSITIVE else None
        )
        return CheckResult(is_correct=match.is_match, correct_answer=shown, note=note)

    def sample_correct_answer(
        self, content: TypeAnswerContent, solution: TypeAnswerSolution
    ) -> TypeAnswerAnswer:
        return TypeAnswerAnswer(text=solution.accepted[0])

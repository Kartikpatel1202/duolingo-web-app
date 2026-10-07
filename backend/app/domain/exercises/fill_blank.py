"""Fill in the blank: complete a sentence with the missing word(s).

`options` (optional) turns the blank into a tap-to-choose exercise; otherwise it is typed.
Correct iff the normalised text matches an accepted answer (accent slips accepted with a note).
"""

from typing import Literal

from pydantic import Field

from app.domain.enums import ExerciseType
from app.domain.errors import InvalidAnswer
from app.domain.exercises.base import (
    CheckResult,
    ExerciseChecker,
    ExerciseDefinitionError,
    ExerciseModel,
    join_sentence,
)
from app.domain.text import MatchKind, match_text, normalize


class FillBlankContent(ExerciseModel):
    before: str = ""
    after: str = ""
    translation: str | None = None
    language: str | None = None  # language hint (BCP-47) for text-to-speech
    options: list[str] | None = Field(default=None, min_length=2, max_length=6)


class FillBlankSolution(ExerciseModel):
    accepted: list[str] = Field(min_length=1)


class FillBlankAnswer(ExerciseModel):
    type: Literal["fill_blank"] = "fill_blank"
    text: str = Field(max_length=100)


class FillBlankReveal(ExerciseModel):
    type: Literal["fill_blank"] = "fill_blank"
    text: str


class FillBlankChecker(ExerciseChecker[FillBlankContent, FillBlankSolution, FillBlankAnswer]):
    exercise_type = ExerciseType.FILL_BLANK
    content_model = FillBlankContent
    solution_model = FillBlankSolution
    answer_model = FillBlankAnswer

    def check_definition(self, content: FillBlankContent, solution: FillBlankSolution) -> None:
        if not (content.before or content.after):
            raise ExerciseDefinitionError("A blank needs surrounding text.")
        if content.options is not None:
            options = {normalize(option) for option in content.options}
            if not any(normalize(answer) in options for answer in solution.accepted):
                raise ExerciseDefinitionError("No accepted answer is among the options.")

    def validate_answer(self, content: FillBlankContent, answer: FillBlankAnswer) -> None:
        if not normalize(answer.text):
            raise InvalidAnswer("The answer is empty.")

    def check(
        self, content: FillBlankContent, solution: FillBlankSolution, answer: FillBlankAnswer
    ) -> CheckResult:
        match = match_text(answer.text, solution.accepted)
        shown = match.matched or solution.accepted[0]
        note = None
        if match.kind is MatchKind.ACCENT_INSENSITIVE:
            note = f"Watch your accents: {shown}"
        return CheckResult(
            is_correct=match.is_match,
            correct_answer=join_sentence(content.before, shown, content.after),
            note=note,
        )

    def reveal(self, content: FillBlankContent, solution: FillBlankSolution) -> FillBlankReveal:
        return FillBlankReveal(text=solution.accepted[0])

    def sample_correct_answer(
        self, content: FillBlankContent, solution: FillBlankSolution
    ) -> FillBlankAnswer:
        return FillBlankAnswer(text=solution.accepted[0])

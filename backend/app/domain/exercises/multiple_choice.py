"""Multiple choice: pick one option. Correct iff the chosen option id is the solution's id."""

from typing import Literal

from pydantic import Field

from app.domain.enums import ExerciseType
from app.domain.errors import InvalidAnswer
from app.domain.exercises.base import (
    CheckResult,
    ExerciseChecker,
    ExerciseDefinitionError,
    ExerciseModel,
    ensure_unique_ids,
)


class ChoiceOption(ExerciseModel):
    id: str = Field(min_length=1, max_length=16)
    text: str = Field(min_length=1)
    emoji: str | None = None


class MultipleChoiceContent(ExerciseModel):
    source_text: str | None = None
    source_language: str | None = None  # language hints (BCP-47) for text-to-speech
    options_language: str | None = None
    # Set on picture cards that introduce a word, so the player can tag them "New word".
    label: Literal["new_word"] | None = None
    options: list[ChoiceOption] = Field(min_length=2, max_length=6)


class MultipleChoiceSolution(ExerciseModel):
    correct_option_id: str


class MultipleChoiceAnswer(ExerciseModel):
    type: Literal["multiple_choice"] = "multiple_choice"
    option_id: str = Field(min_length=1, max_length=16)


class MultipleChoiceReveal(ExerciseModel):
    type: Literal["multiple_choice"] = "multiple_choice"
    correct_option_id: str


class MultipleChoiceChecker(
    ExerciseChecker[MultipleChoiceContent, MultipleChoiceSolution, MultipleChoiceAnswer]
):
    exercise_type = ExerciseType.MULTIPLE_CHOICE
    content_model = MultipleChoiceContent
    solution_model = MultipleChoiceSolution
    answer_model = MultipleChoiceAnswer

    def check_definition(
        self, content: MultipleChoiceContent, solution: MultipleChoiceSolution
    ) -> None:
        ids = [option.id for option in content.options]
        ensure_unique_ids(ids, "Option")
        if solution.correct_option_id not in ids:
            raise ExerciseDefinitionError("correct_option_id is not one of the options.")

    def validate_answer(self, content: MultipleChoiceContent, answer: MultipleChoiceAnswer) -> None:
        if answer.option_id not in {option.id for option in content.options}:
            raise InvalidAnswer("Unknown option.", option_id=answer.option_id)

    def check(
        self,
        content: MultipleChoiceContent,
        solution: MultipleChoiceSolution,
        answer: MultipleChoiceAnswer,
    ) -> CheckResult:
        correct = next(o for o in content.options if o.id == solution.correct_option_id)
        return CheckResult(
            is_correct=answer.option_id == solution.correct_option_id,
            correct_answer=correct.text,
        )

    def reveal(
        self, content: MultipleChoiceContent, solution: MultipleChoiceSolution
    ) -> MultipleChoiceReveal:
        return MultipleChoiceReveal(correct_option_id=solution.correct_option_id)

    def sample_correct_answer(
        self, content: MultipleChoiceContent, solution: MultipleChoiceSolution
    ) -> MultipleChoiceAnswer:
        return MultipleChoiceAnswer(option_id=solution.correct_option_id)

"""Exercise API contracts.

Learner-facing exercises are a discriminated union on `type`. Each variant exposes only the type's
**Content** model — no variant has a solution field, so a solution cannot be serialised even by
accident. Answers are a discriminated union of each type's **Answer** model, and reveals (the
structured correct answer returned *after* a check) a union of each type's **Reveal** model.

When adding an exercise type, add its variants below (a test fails until you do).
"""

from typing import Annotated, Literal

from pydantic import Field, TypeAdapter

from app.domain.exercises.fill_blank import FillBlankAnswer, FillBlankContent, FillBlankReveal
from app.domain.exercises.match_pairs import MatchPairsAnswer, MatchPairsContent, MatchPairsReveal
from app.domain.exercises.multiple_choice import (
    MultipleChoiceAnswer,
    MultipleChoiceContent,
    MultipleChoiceReveal,
)
from app.domain.exercises.type_answer import TypeAnswerAnswer, TypeAnswerContent, TypeAnswerReveal
from app.domain.exercises.word_bank import WordBankAnswer, WordBankContent, WordBankReveal
from app.schemas.common import ApiModel


class _ExerciseOutBase(ApiModel):
    id: int
    position: int
    prompt: str


class MultipleChoiceExerciseOut(_ExerciseOutBase):
    type: Literal["multiple_choice"]
    content: MultipleChoiceContent


class WordBankExerciseOut(_ExerciseOutBase):
    type: Literal["word_bank"]
    content: WordBankContent


class MatchPairsExerciseOut(_ExerciseOutBase):
    type: Literal["match_pairs"]
    content: MatchPairsContent


class FillBlankExerciseOut(_ExerciseOutBase):
    type: Literal["fill_blank"]
    content: FillBlankContent


class TypeAnswerExerciseOut(_ExerciseOutBase):
    type: Literal["type_answer"]
    content: TypeAnswerContent


ExerciseOut = Annotated[
    MultipleChoiceExerciseOut
    | WordBankExerciseOut
    | MatchPairsExerciseOut
    | FillBlankExerciseOut
    | TypeAnswerExerciseOut,
    Field(discriminator="type"),
]

AnswerIn = Annotated[
    MultipleChoiceAnswer | WordBankAnswer | MatchPairsAnswer | FillBlankAnswer | TypeAnswerAnswer,
    Field(discriminator="type"),
]

RevealOut = Annotated[
    MultipleChoiceReveal | WordBankReveal | MatchPairsReveal | FillBlankReveal | TypeAnswerReveal,
    Field(discriminator="type"),
]

exercise_out_adapter: TypeAdapter[ExerciseOut] = TypeAdapter(ExerciseOut)

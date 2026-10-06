"""Exercise type → checker. The only place that enumerates checkers.

Adding a new exercise type: write its module (models + checker), add one line here, add its
public/answer models to the unions in app/schemas/exercise.py. The lesson engine is unchanged.
"""

from collections.abc import Mapping
from typing import Any

from app.domain.enums import ExerciseType
from app.domain.exercises.base import ExerciseChecker
from app.domain.exercises.fill_blank import FillBlankChecker
from app.domain.exercises.match_pairs import MatchPairsChecker
from app.domain.exercises.multiple_choice import MultipleChoiceChecker
from app.domain.exercises.type_answer import TypeAnswerChecker
from app.domain.exercises.word_bank import WordBankChecker

AnyChecker = ExerciseChecker[Any, Any, Any]

CHECKERS: Mapping[ExerciseType, AnyChecker] = {
    checker.exercise_type: checker
    for checker in (
        MultipleChoiceChecker(),
        WordBankChecker(),
        MatchPairsChecker(),
        FillBlankChecker(),
        TypeAnswerChecker(),
    )
}


def get_checker(exercise_type: ExerciseType) -> AnyChecker:
    return CHECKERS[exercise_type]

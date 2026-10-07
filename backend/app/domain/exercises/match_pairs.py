"""Match pairs: connect every left item to its right item.

The whole set is submitted at once. Well-formed answers use every left and every right item
exactly once; the answer is correct iff the submitted mapping equals the solution exactly.
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
    ensure_unique_ids,
)


class PairItem(ExerciseModel):
    id: str = Field(min_length=1, max_length=16)
    text: str = Field(min_length=1)


class MatchPairsContent(ExerciseModel):
    left: list[PairItem] = Field(min_length=2, max_length=6)
    right: list[PairItem] = Field(min_length=2, max_length=6)
    left_language: str | None = None  # language hints (BCP-47) for text-to-speech
    right_language: str | None = None


class MatchPairsSolution(ExerciseModel):
    pairs: dict[str, str]  # left id → right id


class SubmittedPair(ExerciseModel):
    left_id: str = Field(min_length=1, max_length=16)
    right_id: str = Field(min_length=1, max_length=16)


class MatchPairsAnswer(ExerciseModel):
    type: Literal["match_pairs"] = "match_pairs"
    pairs: list[SubmittedPair] = Field(min_length=1, max_length=6)


class MatchPairsReveal(ExerciseModel):
    type: Literal["match_pairs"] = "match_pairs"
    pairs: list[SubmittedPair]


class MatchPairsChecker(ExerciseChecker[MatchPairsContent, MatchPairsSolution, MatchPairsAnswer]):
    exercise_type = ExerciseType.MATCH_PAIRS
    content_model = MatchPairsContent
    solution_model = MatchPairsSolution
    answer_model = MatchPairsAnswer

    def check_definition(self, content: MatchPairsContent, solution: MatchPairsSolution) -> None:
        left_ids = [item.id for item in content.left]
        right_ids = [item.id for item in content.right]
        ensure_unique_ids(left_ids, "Left item")
        ensure_unique_ids(right_ids, "Right item")
        if set(solution.pairs) != set(left_ids) or sorted(solution.pairs.values()) != sorted(
            right_ids
        ):
            raise ExerciseDefinitionError("Solution must pair every item exactly once.")

    def validate_answer(self, content: MatchPairsContent, answer: MatchPairsAnswer) -> None:
        left = [pair.left_id for pair in answer.pairs]
        right = [pair.right_id for pair in answer.pairs]
        if sorted(left) != sorted(item.id for item in content.left) or sorted(right) != sorted(
            item.id for item in content.right
        ):
            raise InvalidAnswer("Every item must be matched exactly once.")

    def check(
        self, content: MatchPairsContent, solution: MatchPairsSolution, answer: MatchPairsAnswer
    ) -> CheckResult:
        submitted = {pair.left_id: pair.right_id for pair in answer.pairs}
        return CheckResult(
            is_correct=submitted == solution.pairs,
            correct_answer=self._describe(content, solution),
        )

    def reveal(self, content: MatchPairsContent, solution: MatchPairsSolution) -> MatchPairsReveal:
        return MatchPairsReveal(pairs=self.sample_correct_answer(content, solution).pairs)

    def sample_correct_answer(
        self, content: MatchPairsContent, solution: MatchPairsSolution
    ) -> MatchPairsAnswer:
        return MatchPairsAnswer(
            pairs=[
                SubmittedPair(left_id=left_id, right_id=right_id)
                for left_id, right_id in solution.pairs.items()
            ]
        )

    @staticmethod
    def _describe(content: MatchPairsContent, solution: MatchPairsSolution) -> str:
        left = {item.id: item.text for item in content.left}
        right = {item.id: item.text for item in content.right}
        return ", ".join(
            f"{left[left_id]} = {right[right_id]}" for left_id, right_id in solution.pairs.items()
        )

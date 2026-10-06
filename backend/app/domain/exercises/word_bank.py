"""Word bank: build a sentence by tapping tiles in order.

Correct iff the ordered tile texts form one of the accepted sentences (after cosmetic
normalisation). Tiles are compared by **text, not id**, so duplicate tokens are interchangeable.
Word order is significant. Distractor tiles may be present.
"""

from collections import Counter
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
from app.domain.text import normalize


class WordTile(ExerciseModel):
    id: str = Field(min_length=1, max_length=16)
    text: str = Field(min_length=1)


class WordBankContent(ExerciseModel):
    source_text: str = Field(min_length=1)
    tiles: list[WordTile] = Field(min_length=2, max_length=16)


class WordBankSolution(ExerciseModel):
    accepted: list[str] = Field(min_length=1)


class WordBankAnswer(ExerciseModel):
    type: Literal["word_bank"] = "word_bank"
    tile_ids: list[str] = Field(min_length=1, max_length=16)


def _tokens(sentence: str) -> list[str]:
    return normalize(sentence).split()


class WordBankChecker(ExerciseChecker[WordBankContent, WordBankSolution, WordBankAnswer]):
    exercise_type = ExerciseType.WORD_BANK
    content_model = WordBankContent
    solution_model = WordBankSolution
    answer_model = WordBankAnswer

    def check_definition(self, content: WordBankContent, solution: WordBankSolution) -> None:
        ensure_unique_ids([tile.id for tile in content.tiles], "Tile")
        available = Counter(normalize(tile.text) for tile in content.tiles)
        for sentence in solution.accepted:
            needed = Counter(_tokens(sentence))
            if needed - available:
                raise ExerciseDefinitionError(f"Tiles cannot build accepted answer {sentence!r}.")

    def validate_answer(self, content: WordBankContent, answer: WordBankAnswer) -> None:
        known = {tile.id for tile in content.tiles}
        unknown = [tile_id for tile_id in answer.tile_ids if tile_id not in known]
        if unknown:
            raise InvalidAnswer("Unknown tiles.", tile_ids=unknown)
        if len(answer.tile_ids) != len(set(answer.tile_ids)):
            raise InvalidAnswer("A tile can only be used once.")

    def check(
        self, content: WordBankContent, solution: WordBankSolution, answer: WordBankAnswer
    ) -> CheckResult:
        text_by_id = {tile.id: tile.text for tile in content.tiles}
        built = normalize(" ".join(text_by_id[tile_id] for tile_id in answer.tile_ids))
        accepted = {normalize(sentence) for sentence in solution.accepted}
        return CheckResult(is_correct=built in accepted, correct_answer=solution.accepted[0])

    def sample_correct_answer(
        self, content: WordBankContent, solution: WordBankSolution
    ) -> WordBankAnswer:
        unused = list(content.tiles)
        tile_ids: list[str] = []
        for token in _tokens(solution.accepted[0]):
            tile = next(t for t in unused if normalize(t.text) == token)
            unused.remove(tile)
            tile_ids.append(tile.id)
        return WordBankAnswer(tile_ids=tile_ids)

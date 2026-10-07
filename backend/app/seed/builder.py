"""Turns a LessonSpec into exercise rows (deterministically).

Lessons rotate between three layouts so consecutive lessons feel different, while every lesson
still exercises all five types:

A (7): pick word · match · tiles es→en · fill · meaning · type en→es · tiles en→es
B (6): match · fill · meaning · tiles en→es · type en→es · pick word
C (6): tiles es→en · pick word · type en→es · match · fill · meaning

(pick word = multiple choice with emoji; meaning = multiple choice, Spanish → English.)

Shuffling uses `random.Random(key)` with a fixed per-lesson key, so every run of the seed produces
byte-identical content.
"""

import random
import re
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any, TypeVar

from app.domain.enums import ExerciseType
from app.domain.exercises import get_checker
from app.domain.text import normalize
from app.seed.specs import LessonSpec, Sentence, Word

_WORD = re.compile(r"[\w']+")
_OPTION_IDS = "abcdefgh"
T = TypeVar("T")


@dataclass(frozen=True)
class ExerciseDraft:
    type: ExerciseType
    prompt: str
    content: dict[str, Any]
    solution: dict[str, Any]
    explanation: str | None = None


Step = Callable[[LessonSpec, random.Random], "ExerciseDraft"]


def build_lesson(spec: LessonSpec, key: str, layout: int = 0) -> list[ExerciseDraft]:
    """Exercises for one lesson; `layout` picks one of LAYOUTS (rotated by the seeder)."""
    rng = random.Random(key)
    drafts = [step(spec, rng) for step in LAYOUTS[layout % len(LAYOUTS)]]
    for draft in drafts:  # fail fast on inconsistent content
        get_checker(draft.type).validate_definition(draft.content, draft.solution)
    return drafts


def _layouts() -> tuple[tuple[Step, ...], ...]:
    def word(i: int) -> Step:
        return lambda spec, rng: _choose_spanish_word(spec.words, spec.words[i], rng)

    def meaning(i: int) -> Step:
        return lambda spec, rng: _choose_english_meaning(spec.words, spec.words[i], rng)

    def tiles(i: int, *, to_spanish: bool) -> Step:
        return lambda spec, rng: _word_bank(
            spec.sentences[i], spec.sentences, to_spanish=to_spanish, rng=rng
        )

    def fill(i: int) -> Step:
        return lambda spec, rng: _fill_blank(spec.sentences[i], spec, rng)

    def typed(i: int) -> Step:
        return lambda spec, rng: _type_answer(spec.sentences[i])

    def match() -> Step:
        return lambda spec, rng: _match_pairs(spec.words, rng)

    return (
        (
            word(0),
            match(),
            tiles(0, to_spanish=False),
            fill(1),
            meaning(1),
            typed(2),
            tiles(1, to_spanish=True),
        ),
        (match(), fill(0), meaning(2), tiles(2, to_spanish=True), typed(1), word(3)),
        (tiles(1, to_spanish=False), word(1), typed(0), match(), fill(2), meaning(3)),
    )


LAYOUTS = _layouts()


# --- exercise builders -----------------------------------------------------------------------


def _choose_spanish_word(
    words: tuple[Word, ...], target: Word, rng: random.Random
) -> ExerciseDraft:
    shuffled = _shuffled(list(words), rng)
    options = [
        {"id": _OPTION_IDS[i], "text": word.es, "emoji": word.emoji}
        for i, word in enumerate(shuffled)
    ]
    # "the cat" -> “cat”: the article is part of the vocabulary entry, not of the question.
    asked = target.en.removeprefix("the ").removeprefix("a ")
    return ExerciseDraft(
        type=ExerciseType.MULTIPLE_CHOICE,
        prompt=f"Which one of these is “{asked}”?",
        content={"options": options, "options_language": "es", "label": "new_word"},
        solution={"correct_option_id": _OPTION_IDS[shuffled.index(target)]},
    )


def _choose_english_meaning(
    words: tuple[Word, ...], target: Word, rng: random.Random
) -> ExerciseDraft:
    shuffled = _shuffled(list(words), rng)
    options = [{"id": _OPTION_IDS[i], "text": word.en} for i, word in enumerate(shuffled)]
    return ExerciseDraft(
        type=ExerciseType.MULTIPLE_CHOICE,
        prompt="What does this mean?",
        content={
            "source_text": target.es,
            "source_language": "es",
            "options": options,
            "options_language": "en",
        },
        solution={"correct_option_id": _OPTION_IDS[shuffled.index(target)]},
    )


def _match_pairs(words: tuple[Word, ...], rng: random.Random) -> ExerciseDraft:
    left = [{"id": f"l{i + 1}", "text": word.es} for i, word in enumerate(words)]
    right_words = _shuffled(list(words), rng)
    if right_words == list(words):  # never let row order give the pairing away
        right_words = right_words[1:] + right_words[:1]
    right = [{"id": f"r{i + 1}", "text": word.en} for i, word in enumerate(right_words)]
    pairs = {f"l{i + 1}": f"r{right_words.index(word) + 1}" for i, word in enumerate(words)}
    return ExerciseDraft(
        type=ExerciseType.MATCH_PAIRS,
        prompt="Tap the matching pairs",
        content={"left": left, "right": right, "left_language": "es", "right_language": "en"},
        solution={"pairs": pairs},
    )


def _word_bank(
    sentence: Sentence, all_sentences: tuple[Sentence, ...], *, to_spanish: bool, rng: random.Random
) -> ExerciseDraft:
    source, target, alternatives = (
        (sentence.en, sentence.es, sentence.es_alt)
        if to_spanish
        else (sentence.es, sentence.en, sentence.en_alt)
    )
    tokens = _WORD.findall(target)
    used = {normalize(token) for token in tokens}
    distractors: list[str] = []
    for other in all_sentences:
        for token in _WORD.findall(other.es if to_spanish else other.en):
            if normalize(token) not in used and token not in distractors:
                distractors.append(token)
    tile_texts = _shuffled(tokens + distractors[:3], rng)
    tiles = [{"id": f"t{i + 1}", "text": text} for i, text in enumerate(tile_texts)]

    available = sorted(normalize(text) for text in tile_texts)
    buildable = [alt for alt in alternatives if _fits(normalize(alt).split(), list(available))]
    return ExerciseDraft(
        type=ExerciseType.WORD_BANK,
        prompt="Translate this sentence",
        content={
            "source_text": source,
            "source_language": "en" if to_spanish else "es",
            "tiles": tiles,
            "tiles_language": "es" if to_spanish else "en",
        },
        solution={"accepted": [target, *buildable]},
        explanation=sentence.tip,
    )


def _fill_blank(sentence: Sentence, spec: LessonSpec, rng: random.Random) -> ExerciseDraft:
    match = re.search(rf"(?<![\w']){re.escape(sentence.blank)}(?![\w'])", sentence.es)
    if match is None:
        raise ValueError(f"Blank {sentence.blank!r} not found in {sentence.es!r}")
    candidates = sorted(
        {
            token
            for word in spec.words
            for token in _WORD.findall(word.es)
            if normalize(token) != normalize(sentence.blank) and len(token) > 2
        }
    )
    options = _shuffled([sentence.blank, *rng.sample(candidates, k=2)], rng)
    return ExerciseDraft(
        type=ExerciseType.FILL_BLANK,
        prompt="Complete the sentence",
        content={
            "before": sentence.es[: match.start()].strip(),
            "after": sentence.es[match.end() :].strip(),
            "translation": sentence.en,
            "language": "es",
            "options": options,
        },
        solution={"accepted": [sentence.blank]},
        explanation=sentence.tip,
    )


def _type_answer(sentence: Sentence) -> ExerciseDraft:
    return ExerciseDraft(
        type=ExerciseType.TYPE_ANSWER,
        prompt="Write this in Spanish",
        content={"source_text": sentence.en, "source_language": "en", "target_language": "es"},
        solution={"accepted": [sentence.es, *sentence.es_alt]},
        explanation=sentence.tip,
    )


# --- helpers ---------------------------------------------------------------------------------


def _shuffled(items: list[T], rng: random.Random) -> list[T]:
    copy = list(items)
    rng.shuffle(copy)
    return copy


def _fits(needed: list[str], available: list[str]) -> bool:
    for token in needed:
        if token not in available:
            return False
        available.remove(token)
    return True

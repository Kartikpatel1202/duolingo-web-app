"""Turns a LessonSpec into exercise rows (deterministically).

Every lesson gets the same 7-step shape, covering all five exercise types:

1. multiple_choice  — pick the Spanish word for an English word (with emoji)
2. match_pairs      — match the four Spanish words to their English meaning
3. word_bank        — Spanish → English, build sentence 1 from tiles (+ distractors)
4. fill_blank       — complete sentence 2 by choosing the missing Spanish word
5. multiple_choice  — pick the English meaning of a Spanish word
6. type_answer      — English → Spanish, type sentence 3
7. word_bank        — English → Spanish, build sentence 2 from tiles (+ distractors)

Shuffling uses `random.Random(key)` with a fixed per-lesson key, so every run of the seed produces
byte-identical content.
"""

import random
import re
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


def build_lesson(spec: LessonSpec, key: str) -> list[ExerciseDraft]:
    rng = random.Random(key)
    w1, w2, _, _ = spec.words
    s1, s2, s3 = spec.sentences
    drafts = [
        _choose_spanish_word(spec.words, w1, rng),
        _match_pairs(spec.words, rng),
        _word_bank(s1, spec.sentences, to_spanish=False, rng=rng),
        _fill_blank(s2, spec, rng),
        _choose_english_meaning(spec.words, w2, rng),
        _type_answer(s3),
        _word_bank(s2, spec.sentences, to_spanish=True, rng=rng),
    ]
    for draft in drafts:  # fail fast on inconsistent content
        get_checker(draft.type).validate_definition(draft.content, draft.solution)
    return drafts


# --- exercise builders -----------------------------------------------------------------------


def _choose_spanish_word(
    words: tuple[Word, ...], target: Word, rng: random.Random
) -> ExerciseDraft:
    shuffled = _shuffled(list(words), rng)
    options = [
        {"id": _OPTION_IDS[i], "text": word.es, "emoji": word.emoji}
        for i, word in enumerate(shuffled)
    ]
    return ExerciseDraft(
        type=ExerciseType.MULTIPLE_CHOICE,
        prompt=f'Which one is "{target.en}"?',
        content={"options": options},
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
        content={"source_text": target.es, "options": options},
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
        content={"left": left, "right": right},
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
        content={"source_text": source, "tiles": tiles},
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

"""Each checker in isolation: correct, incorrect, malformed input and definition validation."""

from typing import Any

import pytest

from app.domain.enums import ExerciseType
from app.domain.errors import InvalidAnswer
from app.domain.exercises import CHECKERS, CheckResult, ExerciseDefinitionError, get_checker
from app.domain.exercises.fill_blank import FillBlankAnswer
from app.domain.exercises.match_pairs import MatchPairsAnswer, SubmittedPair
from app.domain.exercises.multiple_choice import MultipleChoiceAnswer
from app.domain.exercises.type_answer import TypeAnswerAnswer
from app.domain.exercises.word_bank import WordBankAnswer


def evaluate(
    exercise_type: ExerciseType, content: dict[str, Any], solution: dict[str, Any], answer: Any
) -> CheckResult:
    return get_checker(exercise_type).evaluate(content, solution, answer)


def test_every_exercise_type_has_a_checker() -> None:
    assert set(CHECKERS) == set(ExerciseType)


# --- multiple choice ---------------------------------------------------------------------------

MC_CONTENT = {"options": [{"id": "a", "text": "el pan"}, {"id": "b", "text": "la manzana"}]}
MC_SOLUTION = {"correct_option_id": "b"}


def test_multiple_choice_correct_option() -> None:
    result = evaluate(
        ExerciseType.MULTIPLE_CHOICE, MC_CONTENT, MC_SOLUTION, MultipleChoiceAnswer(option_id="b")
    )
    assert result.is_correct
    assert result.correct_answer == "la manzana"


def test_multiple_choice_wrong_option() -> None:
    result = evaluate(
        ExerciseType.MULTIPLE_CHOICE, MC_CONTENT, MC_SOLUTION, MultipleChoiceAnswer(option_id="a")
    )
    assert not result.is_correct
    assert result.correct_answer == "la manzana"


def test_multiple_choice_unknown_option_is_invalid_not_wrong() -> None:
    with pytest.raises(InvalidAnswer):
        evaluate(
            ExerciseType.MULTIPLE_CHOICE,
            MC_CONTENT,
            MC_SOLUTION,
            MultipleChoiceAnswer(option_id="z"),
        )


def test_multiple_choice_definition_must_reference_an_option() -> None:
    with pytest.raises(ExerciseDefinitionError):
        get_checker(ExerciseType.MULTIPLE_CHOICE).validate_definition(
            MC_CONTENT, {"correct_option_id": "x"}
        )


def test_answer_of_another_type_is_rejected() -> None:
    with pytest.raises(InvalidAnswer):
        evaluate(
            ExerciseType.MULTIPLE_CHOICE,
            MC_CONTENT,
            MC_SOLUTION,
            TypeAnswerAnswer(text="la manzana"),
        )


# --- word bank ---------------------------------------------------------------------------------

WB_CONTENT = {
    "source_text": "El niño y la niña.",
    "tiles": [
        {"id": "t1", "text": "The"},
        {"id": "t2", "text": "boy"},
        {"id": "t3", "text": "and"},
        {"id": "t4", "text": "the"},
        {"id": "t5", "text": "girl"},
        {"id": "t6", "text": "cat"},
    ],
}
WB_SOLUTION = {"accepted": ["The boy and the girl."]}


def word_bank(*tile_ids: str) -> CheckResult:
    return evaluate(
        ExerciseType.WORD_BANK, WB_CONTENT, WB_SOLUTION, WordBankAnswer(tile_ids=list(tile_ids))
    )


def test_word_bank_exact_ordered_sequence() -> None:
    assert word_bank("t1", "t2", "t3", "t4", "t5").is_correct


def test_word_bank_duplicate_tokens_are_interchangeable() -> None:
    # "the" and "The" are the same token, so either tile can fill either slot.
    assert word_bank("t4", "t2", "t3", "t1", "t5").is_correct


def test_word_bank_word_order_matters() -> None:
    assert not word_bank("t1", "t5", "t3", "t4", "t2").is_correct


def test_word_bank_distractor_makes_it_wrong() -> None:
    assert not word_bank("t1", "t6", "t3", "t4", "t5").is_correct


def test_word_bank_incomplete_sentence_is_wrong() -> None:
    assert not word_bank("t1", "t2").is_correct


@pytest.mark.parametrize("tile_ids", [["t1", "t1"], ["t1", "t99"]])
def test_word_bank_reused_or_unknown_tiles_are_invalid(tile_ids: list[str]) -> None:
    with pytest.raises(InvalidAnswer):
        word_bank(*tile_ids)


def test_word_bank_definition_must_be_buildable() -> None:
    with pytest.raises(ExerciseDefinitionError):
        get_checker(ExerciseType.WORD_BANK).validate_definition(
            WB_CONTENT, {"accepted": ["The dog and the girl"]}
        )


# --- match pairs -------------------------------------------------------------------------------

MP_CONTENT = {
    "left": [
        {"id": "l1", "text": "uno"},
        {"id": "l2", "text": "dos"},
        {"id": "l3", "text": "tres"},
    ],
    "right": [
        {"id": "r1", "text": "two"},
        {"id": "r2", "text": "three"},
        {"id": "r3", "text": "one"},
    ],
}
MP_SOLUTION = {"pairs": {"l1": "r3", "l2": "r1", "l3": "r2"}}


def match_pairs(*pairs: tuple[str, str]) -> CheckResult:
    answer = MatchPairsAnswer(pairs=[SubmittedPair(left_id=l, right_id=r) for l, r in pairs])  # noqa: E741
    return evaluate(ExerciseType.MATCH_PAIRS, MP_CONTENT, MP_SOLUTION, answer)


def test_match_pairs_all_pairs_correct_in_any_order() -> None:
    assert match_pairs(("l3", "r2"), ("l1", "r3"), ("l2", "r1")).is_correct


def test_match_pairs_one_swapped_pair_is_wrong() -> None:
    result = match_pairs(("l1", "r1"), ("l2", "r3"), ("l3", "r2"))
    assert not result.is_correct
    assert result.correct_answer == "uno = one, dos = two, tres = three"


@pytest.mark.parametrize(
    "pairs",
    [
        (("l1", "r3"), ("l2", "r1")),  # missing a pair
        (("l1", "r3"), ("l1", "r1"), ("l3", "r2")),  # left used twice
        (("l1", "r3"), ("l2", "r3"), ("l3", "r2")),  # right used twice
        (("l1", "r3"), ("l2", "r1"), ("l9", "r2")),  # unknown id
    ],
)
def test_match_pairs_must_use_every_item_exactly_once(pairs: tuple[tuple[str, str], ...]) -> None:
    with pytest.raises(InvalidAnswer):
        match_pairs(*pairs)


def test_match_pairs_definition_must_be_a_bijection() -> None:
    with pytest.raises(ExerciseDefinitionError):
        get_checker(ExerciseType.MATCH_PAIRS).validate_definition(
            MP_CONTENT, {"pairs": {"l1": "r1", "l2": "r1", "l3": "r2"}}
        )


# --- fill blank --------------------------------------------------------------------------------

FB_CONTENT = {"before": "Hola, me", "after": "Ana.", "options": ["llamo", "como", "bebo"]}
FB_SOLUTION = {"accepted": ["llamo"]}


def fill_blank(text: str) -> CheckResult:
    return evaluate(ExerciseType.FILL_BLANK, FB_CONTENT, FB_SOLUTION, FillBlankAnswer(text=text))


def test_fill_blank_correct_word_and_full_sentence_feedback() -> None:
    result = fill_blank("llamo")
    assert result.is_correct
    assert result.correct_answer == "Hola, me llamo Ana."


@pytest.mark.parametrize("text", ["LLAMO", "  llamo ", "llamo."])
def test_fill_blank_ignores_case_whitespace_and_punctuation(text: str) -> None:
    assert fill_blank(text).is_correct


def test_fill_blank_wrong_word() -> None:
    assert not fill_blank("como").is_correct


def test_fill_blank_empty_answer_is_invalid() -> None:
    with pytest.raises(InvalidAnswer):
        fill_blank("  ?! ")


def test_fill_blank_accent_slip_is_accepted_with_note() -> None:
    result = evaluate(
        ExerciseType.FILL_BLANK,
        {"before": "¿Cómo", "after": "?"},
        {"accepted": ["estás"]},
        FillBlankAnswer(text="estas"),
    )
    assert result.is_correct
    assert result.note is not None and "estás" in result.note
    assert result.correct_answer == "¿Cómo estás?"


def test_fill_blank_definition_options_must_contain_answer() -> None:
    with pytest.raises(ExerciseDefinitionError):
        get_checker(ExerciseType.FILL_BLANK).validate_definition(
            {"before": "Hola, me", "after": "Ana.", "options": ["como", "bebo"]}, FB_SOLUTION
        )


# --- type answer -------------------------------------------------------------------------------

TA_CONTENT = {"source_text": "I eat bread.", "source_language": "en", "target_language": "es"}
TA_SOLUTION = {"accepted": ["Yo como pan.", "Como pan."]}


def type_answer(text: str) -> CheckResult:
    return evaluate(ExerciseType.TYPE_ANSWER, TA_CONTENT, TA_SOLUTION, TypeAnswerAnswer(text=text))


@pytest.mark.parametrize("text", ["Yo como pan.", "yo como pan", "YO  COMO PAN!", "como pan"])
def test_type_answer_accepts_normalised_alternatives(text: str) -> None:
    assert type_answer(text).is_correct


def test_type_answer_word_order_matters() -> None:
    assert not type_answer("pan como yo").is_correct


def test_type_answer_reports_the_matched_alternative() -> None:
    assert type_answer("como pan").correct_answer == "Como pan."


def test_type_answer_wrong_shows_primary_solution() -> None:
    result = type_answer("yo bebo agua")
    assert not result.is_correct
    assert result.correct_answer == "Yo como pan."


def test_type_answer_accent_tolerance() -> None:
    result = evaluate(
        ExerciseType.TYPE_ANSWER,
        TA_CONTENT,
        {"accepted": ["Hasta mañana."]},
        TypeAnswerAnswer(text="hasta manana"),
    )
    assert result.is_correct
    assert result.note == "Watch your accents: Hasta mañana."


# --- sample answers (used by the seed and by tests) --------------------------------------------


@pytest.mark.parametrize(
    ("exercise_type", "content", "solution"),
    [
        (ExerciseType.MULTIPLE_CHOICE, MC_CONTENT, MC_SOLUTION),
        (ExerciseType.WORD_BANK, WB_CONTENT, WB_SOLUTION),
        (ExerciseType.MATCH_PAIRS, MP_CONTENT, MP_SOLUTION),
        (ExerciseType.FILL_BLANK, FB_CONTENT, FB_SOLUTION),
        (ExerciseType.TYPE_ANSWER, TA_CONTENT, TA_SOLUTION),
    ],
)
def test_sample_correct_answer_is_correct(
    exercise_type: ExerciseType, content: dict[str, Any], solution: dict[str, Any]
) -> None:
    checker = get_checker(exercise_type)
    answer = checker.sample_correct_answer(
        checker.parse_content(content), checker.parse_solution(solution)
    )
    assert checker.evaluate(content, solution, answer).is_correct

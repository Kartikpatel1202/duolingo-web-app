import pytest

from app.domain.text import MatchKind, match_text, normalize


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("  Hola  ", "hola"),
        ("HOLA", "hola"),
        ("¿Cómo estás?", "cómo estás"),
        ("¡Hola, Ana!", "hola ana"),
        ("Yo   como\tpan.", "yo como pan"),
        ("I’m fine", "i'm fine"),  # curly apostrophe
        ("It´s", "it's"),
        ("“quoted”", "quoted"),
        ("ＡＢＣ", "abc"),  # full-width (NFKC)
    ],
)
def test_normalize_removes_cosmetic_differences(raw: str, expected: str) -> None:
    assert normalize(raw) == expected


def test_normalize_keeps_word_order() -> None:
    assert normalize("pan como yo") != normalize("yo como pan")


def test_normalize_keeps_accents_unless_asked() -> None:
    assert normalize("está") == "está"
    assert normalize("está", ignore_accents=True) == "esta"
    assert normalize("año", ignore_accents=True) == "ano"


def test_match_text_exact() -> None:
    match = match_text("muchas gracias", ["Muchas gracias."])
    assert match.kind is MatchKind.EXACT
    assert match.matched == "Muchas gracias."


def test_match_text_accent_insensitive_is_flagged() -> None:
    match = match_text("hasta manana", ["Hasta mañana."])
    assert match.kind is MatchKind.ACCENT_INSENSITIVE
    assert match.is_match


def test_match_text_strict_mode_rejects_accent_slips() -> None:
    assert not match_text("manana", ["mañana"], accent_tolerant=False).is_match


def test_match_text_no_match() -> None:
    match = match_text("hello", ["hola"])
    assert match.kind is MatchKind.NONE
    assert match.matched is None

"""Text normalisation for free-text answers.

Normalisation removes *cosmetic* differences only (case, punctuation, quote style, spacing).
It never reorders or removes words, so word order stays meaningful.
"""

import re
import unicodedata
from dataclasses import dataclass
from enum import StrEnum

_QUOTES = str.maketrans(
    {
        "‘": "'",  # ‘
        "’": "'",  # ’
        "‛": "'",  # ‛
        "′": "'",  # ′
        "´": "'",  # ´
        "`": "'",
        "“": '"',  # “
        "”": '"',  # ”
        "«": '"',  # «
        "»": '"',  # »
    }
)
# Anything that is not a letter/digit, whitespace or an apostrophe is punctuation.
_PUNCTUATION = re.compile(r"[^\w\s']|_")


def normalize(text: str, *, ignore_accents: bool = False) -> str:
    """Canonical form used for comparison: casefolded, punctuation-free, single-spaced."""
    value = unicodedata.normalize("NFKC", text.translate(_QUOTES)).casefold()
    value = _PUNCTUATION.sub(" ", value)
    if ignore_accents:
        value = strip_accents(value)
    return " ".join(value.split())


def strip_accents(text: str) -> str:
    decomposed = unicodedata.normalize("NFD", text)
    return unicodedata.normalize(
        "NFC", "".join(char for char in decomposed if unicodedata.category(char) != "Mn")
    )


class MatchKind(StrEnum):
    EXACT = "exact"
    ACCENT_INSENSITIVE = "accent_insensitive"
    NONE = "none"


@dataclass(frozen=True)
class TextMatch:
    kind: MatchKind
    matched: str | None  # the accepted answer that matched (original spelling)

    @property
    def is_match(self) -> bool:
        return self.kind is not MatchKind.NONE


def match_text(answer: str, accepted: list[str], *, accent_tolerant: bool = True) -> TextMatch:
    """Match a free-text answer against accepted answers.

    1. Exact match after normalisation.
    2. Otherwise, if `accent_tolerant`, a match that ignores accents (é → e, ñ → n). Callers treat
       it as correct but show a "watch your accents" note, like a lenient human teacher would.
    """
    normalized = normalize(answer)
    for candidate in accepted:
        if normalize(candidate) == normalized:
            return TextMatch(MatchKind.EXACT, candidate)

    if accent_tolerant:
        loose = normalize(answer, ignore_accents=True)
        for candidate in accepted:
            if normalize(candidate, ignore_accents=True) == loose:
                return TextMatch(MatchKind.ACCENT_INSENSITIVE, candidate)

    return TextMatch(MatchKind.NONE, None)

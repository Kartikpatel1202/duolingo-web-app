"""XP award rules for completing a lesson."""

from dataclasses import dataclass

from app.domain.enums import XpSource
from app.domain.rules import PERFECT_LESSON_BONUS_XP


@dataclass(frozen=True)
class XpAward:
    source: XpSource
    amount: int


def completion_awards(*, first_completion: bool, lesson_xp: int, mistakes: int) -> list[XpAward]:
    """First completion earns the lesson's XP, plus a bonus for a perfect (mistake-free) run.
    Replaying an already-completed lesson earns no completion XP."""
    if not first_completion:
        return []
    awards = [XpAward(XpSource.LESSON_COMPLETION, lesson_xp)]
    if mistakes == 0:
        awards.append(XpAward(XpSource.PERFECT_BONUS, PERFECT_LESSON_BONUS_XP))
    return awards


def accuracy(*, exercises: int, mistakes: int) -> float:
    """Share of answers that were correct: each exercise is solved once, mistakes add attempts."""
    answered = exercises + mistakes
    return 1.0 if answered == 0 else round(exercises / answered, 4)

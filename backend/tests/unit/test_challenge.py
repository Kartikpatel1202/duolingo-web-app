from datetime import UTC, datetime, timedelta

from app.domain import challenge
from app.domain.enums import AttemptMode, XpSource
from app.domain.rules import LEGENDARY_BONUS_XP, LEGENDARY_MISTAKE_LIMIT, LEGENDARY_TIME_LIMIT
from app.domain.xp import XpAward, completion_awards

T0 = datetime(2026, 10, 7, 10, 0, tzinfo=UTC)


def test_standard_mode_has_no_clock_or_mistake_cap() -> None:
    assert challenge.expires_at(AttemptMode.STANDARD, T0) is None
    assert not challenge.is_expired(AttemptMode.STANDARD, T0, T0 + timedelta(days=30))
    assert challenge.mistakes_remaining(AttemptMode.STANDARD, 99) is None
    assert not challenge.has_failed(AttemptMode.STANDARD, 99)
    assert challenge.MODE_RULES[AttemptMode.STANDARD].costs_hearts


def test_legendary_clock() -> None:
    deadline = T0 + LEGENDARY_TIME_LIMIT
    assert challenge.expires_at(AttemptMode.LEGENDARY, T0) == deadline
    assert not challenge.is_expired(AttemptMode.LEGENDARY, T0, deadline - timedelta(seconds=1))
    assert challenge.is_expired(AttemptMode.LEGENDARY, T0, deadline)


def test_legendary_mistake_cap() -> None:
    assert challenge.mistakes_remaining(AttemptMode.LEGENDARY, 0) == LEGENDARY_MISTAKE_LIMIT
    assert not challenge.has_failed(AttemptMode.LEGENDARY, LEGENDARY_MISTAKE_LIMIT - 1)
    assert challenge.has_failed(AttemptMode.LEGENDARY, LEGENDARY_MISTAKE_LIMIT)
    assert not challenge.MODE_RULES[AttemptMode.LEGENDARY].costs_hearts


def test_first_legendary_win_awards_the_bonus_only() -> None:
    assert completion_awards(
        first_completion=False, lesson_xp=10, mistakes=0, first_legendary=True
    ) == [XpAward(XpSource.LEGENDARY_BONUS, LEGENDARY_BONUS_XP)]

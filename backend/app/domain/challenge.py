"""Attempt modes and their rules.

A mode is a small table of constraints, so a new challenge (e.g. "no mistakes") is one more entry
here rather than new branches across the services.

* standard  — hearts are spent on mistakes, no time limit.
* legendary — replay of a completed lesson: no hearts involved, a time limit and a mistake cap;
              finishing it earns a one-time bonus.
"""

from dataclasses import dataclass
from datetime import datetime, timedelta

from app.domain.enums import AttemptMode
from app.domain.rules import LEGENDARY_MISTAKE_LIMIT, LEGENDARY_TIME_LIMIT


@dataclass(frozen=True)
class ModeRules:
    costs_hearts: bool
    requires_completed_lesson: bool
    time_limit: timedelta | None
    mistake_limit: int | None


MODE_RULES: dict[AttemptMode, ModeRules] = {
    AttemptMode.STANDARD: ModeRules(
        costs_hearts=True, requires_completed_lesson=False, time_limit=None, mistake_limit=None
    ),
    AttemptMode.LEGENDARY: ModeRules(
        costs_hearts=False,
        requires_completed_lesson=True,
        time_limit=LEGENDARY_TIME_LIMIT,
        mistake_limit=LEGENDARY_MISTAKE_LIMIT,
    ),
}


def expires_at(mode: AttemptMode, started_at: datetime) -> datetime | None:
    limit = MODE_RULES[mode].time_limit
    return None if limit is None else started_at + limit


def is_expired(mode: AttemptMode, started_at: datetime, now: datetime) -> bool:
    deadline = expires_at(mode, started_at)
    return deadline is not None and now >= deadline


def mistakes_remaining(mode: AttemptMode, mistakes: int) -> int | None:
    limit = MODE_RULES[mode].mistake_limit
    return None if limit is None else max(0, limit - mistakes)


def has_failed(mode: AttemptMode, mistakes: int) -> bool:
    return mistakes_remaining(mode, mistakes) == 0

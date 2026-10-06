"""Streak rules.

A streak counts consecutive learning days (in APP_TIMEZONE) on which the learner completed at
least one lesson. Only a completion changes the stored state; reads use `displayed_streak`.
"""

from dataclasses import dataclass
from datetime import date, timedelta


@dataclass(frozen=True)
class StreakState:
    current: int
    longest: int
    last_activity_date: date | None


def record_activity(state: StreakState, today: date) -> StreakState:
    """Same day: unchanged. Day after the last activity: +1. Any gap (or first ever): 1."""
    last = state.last_activity_date
    if last == today:
        return state
    current = state.current + 1 if last == today - timedelta(days=1) else 1
    return StreakState(current, max(state.longest, current), today)


def displayed_streak(state: StreakState, today: date) -> int:
    """The streak as the learner sees it: still alive until the end of the day after the last
    activity, 0 once a full day has been missed. Pure — never persisted by reads."""
    last = state.last_activity_date
    if last is None or last < today - timedelta(days=1):
        return 0
    return state.current


def is_active_today(state: StreakState, today: date) -> bool:
    return state.last_activity_date == today

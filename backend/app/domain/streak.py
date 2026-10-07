"""Streak rules.

A streak counts consecutive learning days (in APP_TIMEZONE) on which the learner completed at
least one lesson. Only a completion changes the stored state; reads use `displayed_streak`.

Streak freezes: each freeze the learner owns can cover one missed day. Like hearts, they are
applied lazily — a read treats a gap covered by freezes as still alive, and the next completion
consumes exactly the freezes needed for the gap (`freezes_to_consume`).
"""

from dataclasses import dataclass
from datetime import date, timedelta


@dataclass(frozen=True)
class StreakState:
    current: int
    longest: int
    last_activity_date: date | None


def missed_days(last_activity: date, today: date) -> list[date]:
    """Days strictly between the last activity and today (the days that broke the chain)."""
    return [last_activity + timedelta(days=i) for i in range(1, (today - last_activity).days)]


def freezes_to_consume(state: StreakState, today: date, freezes_available: int) -> list[date]:
    """The missed days a completion today would cover with freezes ([] if none needed/possible)."""
    last = state.last_activity_date
    if last is None or last >= today:
        return []
    gap = missed_days(last, today)
    return gap if 0 < len(gap) <= freezes_available else []


def record_activity(state: StreakState, today: date, freezes_available: int = 0) -> StreakState:
    """Same day: unchanged. Day after the last activity (or a gap fully covered by freezes): +1.
    Any other gap (or first ever): 1."""
    last = state.last_activity_date
    if last == today:
        return state
    continues = last is not None and len(missed_days(last, today)) <= freezes_available
    current = state.current + 1 if continues else 1
    return StreakState(current, max(state.longest, current), today)


def displayed_streak(state: StreakState, today: date, freezes_available: int = 0) -> int:
    """The streak as the learner sees it: alive while every missed day can still be covered by a
    freeze (with none, until the end of the day after the last activity). Pure — never persisted."""
    last = state.last_activity_date
    if last is None:
        return 0
    if last >= today:
        return state.current
    return state.current if len(missed_days(last, today)) <= freezes_available else 0


def is_active_today(state: StreakState, today: date) -> bool:
    return state.last_activity_date == today

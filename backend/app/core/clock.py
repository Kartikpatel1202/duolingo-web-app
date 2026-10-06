"""Time abstraction.

This module is the only place allowed to read the system time. Everything else receives a `Clock`
(services) or plain `datetime`/`date` values (domain functions), which makes streaks, daily XP,
heart regeneration and leaderboard weeks deterministic in tests.

Timezone strategy: instants are always timezone-aware UTC; calendar concepts ("learning day",
"learning week") are derived with `local_date` in the single configured APP_TIMEZONE.
"""

from datetime import UTC, date, datetime, timedelta
from typing import Protocol
from zoneinfo import ZoneInfo


class Clock(Protocol):
    def now(self) -> datetime:
        """Current instant as a timezone-aware UTC datetime."""
        ...


class SystemClock:
    def now(self) -> datetime:
        return datetime.now(UTC)


class FixedClock:
    """A controllable clock for tests and for seeding historical demo activity."""

    def __init__(self, now: datetime) -> None:
        self._now = ensure_utc(now)

    def now(self) -> datetime:
        return self._now

    def set(self, now: datetime) -> None:
        self._now = ensure_utc(now)

    def advance(self, delta: timedelta) -> None:
        self._now += delta


def ensure_utc(instant: datetime) -> datetime:
    if instant.tzinfo is None:
        raise ValueError("Naive datetimes are not allowed; pass a timezone-aware datetime.")
    return instant.astimezone(UTC)


def local_date(instant: datetime, tz: ZoneInfo) -> date:
    """The learner-facing calendar day of an instant in the application timezone."""
    return ensure_utc(instant).astimezone(tz).date()


def local_midnight_utc(day: date, tz: ZoneInfo) -> datetime:
    """The UTC instant at which `day` starts in the application timezone."""
    return datetime(day.year, day.month, day.day, tzinfo=tz).astimezone(UTC)

"""Streak screen: current streak plus a month calendar of practiced and frozen days."""

from datetime import date, timedelta

from app.core.clock import local_date, local_midnight_utc
from app.domain.errors import InvalidMonth
from app.domain.rules import MAX_STREAK_FREEZES, STREAK_SOCIETY_DAYS
from app.models import User
from app.repositories import AttemptRepository, RewardRepository
from app.schemas.engagement import StreakCalendarOut, StreakSocietyOut
from app.services.context import ServiceContext
from app.services.stats_service import StatsService


def parse_month(month: str | None, today: date) -> date:
    """First day of the requested month (default: this month)."""
    if month is None:
        return today.replace(day=1)
    try:
        year, number = (int(part) for part in month.split("-"))
        return date(year, number, 1)
    except ValueError as error:
        raise InvalidMonth(month=month) from error


def next_month(first: date) -> date:
    return (first + timedelta(days=32)).replace(day=1)


class StreakService:
    def __init__(self, ctx: ServiceContext) -> None:
        self._ctx = ctx
        self._attempts = AttemptRepository(ctx.session)
        self._rewards = RewardRepository(ctx.session)
        self._stats = StatsService(ctx)

    def calendar(self, user: User, month: str | None) -> StreakCalendarOut:
        today = self._ctx.today()
        first = parse_month(month, today)
        after = next_month(first)
        tz = self._ctx.timezone
        completions = self._attempts.completions_between(
            user.id, local_midnight_utc(first, tz), local_midnight_utc(after, tz)
        )
        practiced = sorted({local_date(completed_at, tz) for completed_at, _ in completions})
        frozen = sorted(self._rewards.freeze_days(user.id, first, after - timedelta(days=1)))
        streak = self._stats.streak(user)
        return StreakCalendarOut(
            current=streak.current,
            longest=streak.longest,
            active_today=streak.active_today,
            freezes_owned=user.streak_freezes,
            freezes_max=MAX_STREAK_FREEZES,
            month=first.strftime("%Y-%m"),
            today=today,
            practiced_days=practiced,
            freeze_days=frozen,
            days_practiced=len(practiced),
            freezes_used=len(frozen),
            society=StreakSocietyOut(
                threshold=STREAK_SOCIETY_DAYS,
                unlocked=streak.longest >= STREAK_SOCIETY_DAYS,
                days_to_go=max(0, STREAK_SOCIETY_DAYS - streak.current),
            ),
        )

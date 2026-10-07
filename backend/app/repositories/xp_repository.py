"""XP ledger aggregates and weekly leaderboard entries."""

from collections.abc import Sequence
from datetime import date

from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.models import LeaderboardEntry, User, XpEvent


class XpRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    # --- ledger ---------------------------------------------------------------------------------

    def total_xp(self, user_id: int) -> int:
        statement = select(func.coalesce(func.sum(XpEvent.amount), 0)).where(
            XpEvent.user_id == user_id
        )
        return int(self._session.scalar(statement) or 0)

    def xp_by_day(self, user_id: int, first_day: date, last_day: date) -> dict[date, int]:
        statement = (
            select(XpEvent.earned_on, func.sum(XpEvent.amount))
            .where(XpEvent.user_id == user_id, XpEvent.earned_on.between(first_day, last_day))
            .group_by(XpEvent.earned_on)
        )
        return {day: int(total) for day, total in self._session.execute(statement)}

    def xp_on(self, user_id: int, day: date) -> int:
        return self.xp_by_day(user_id, day, day).get(day, 0)

    def events_for_attempt(self, attempt_id: str) -> Sequence[XpEvent]:
        statement = (
            select(XpEvent).where(XpEvent.lesson_attempt_id == attempt_id).order_by(XpEvent.id)
        )
        return self._session.scalars(statement).all()

    # --- weekly leaderboard ---------------------------------------------------------------------

    def get_entry(self, user_id: int, week_start: date) -> LeaderboardEntry | None:
        statement = select(LeaderboardEntry).where(
            LeaderboardEntry.user_id == user_id, LeaderboardEntry.week_start == week_start
        )
        return self._session.scalars(statement).one_or_none()

    def entries_before(self, week_start: date) -> Sequence[LeaderboardEntry]:
        """Every learner's entry for every week before `week_start` (league history)."""
        statement = select(LeaderboardEntry).where(LeaderboardEntry.week_start < week_start)
        return self._session.scalars(statement).all()

    def weekly_standings(self, week_start: date) -> Sequence[tuple[User, LeaderboardEntry | None]]:
        """Every learner with their entry for the week (None if no XP yet). Everyone in the
        league is listed, so a new week shows the league at 0 XP rather than an empty board."""
        statement = (
            select(User, LeaderboardEntry)
            .outerjoin(
                LeaderboardEntry,
                and_(
                    LeaderboardEntry.user_id == User.id,
                    LeaderboardEntry.week_start == week_start,
                ),
            )
            .order_by(User.id)
        )
        return self._session.execute(statement).all()

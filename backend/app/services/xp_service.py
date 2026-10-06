"""The single writer of XP.

Every XP award appends ledger rows and updates the weekly leaderboard cache in the same
transaction, which is what keeps `leaderboard_entries.xp == SUM(xp_events)` for each week.
"""

from collections.abc import Sequence
from datetime import datetime

from app.core.clock import local_date
from app.domain.leaderboard import week_start
from app.domain.xp import XpAward
from app.models import LeaderboardEntry, XpEvent
from app.repositories import XpRepository
from app.services.context import ServiceContext


class XpService:
    def __init__(self, ctx: ServiceContext) -> None:
        self._ctx = ctx
        self._xp = XpRepository(ctx.session)

    def award(
        self,
        user_id: int,
        awards: Sequence[XpAward],
        *,
        earned_at: datetime,
        attempt_id: str | None = None,
    ) -> int:
        """Record awards (does not commit). Returns the XP added."""
        total = sum(award.amount for award in awards)
        if total == 0:
            return 0

        earned_on = local_date(earned_at, self._ctx.timezone)
        for award in awards:
            self._ctx.session.add(
                XpEvent(
                    user_id=user_id,
                    lesson_attempt_id=attempt_id,
                    source=award.source,
                    amount=award.amount,
                    earned_at=earned_at,
                    earned_on=earned_on,
                )
            )

        week = week_start(earned_on)
        entry = self._xp.get_entry(user_id, week)
        if entry is None:
            entry = LeaderboardEntry(user_id=user_id, week_start=week, xp=0)
            self._ctx.session.add(entry)
        entry.xp += total
        entry.updated_at = earned_at
        return total

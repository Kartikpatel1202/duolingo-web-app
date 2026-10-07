"""Read-only learner statistics derived from facts (XP ledger, streak state)."""

from app.domain import streak as streak_rules
from app.domain.streak import StreakState
from app.models import User
from app.repositories import XpRepository
from app.schemas.common import DailyGoalOut, StreakOut
from app.services.context import ServiceContext


def streak_state(user: User) -> StreakState:
    return StreakState(user.current_streak, user.longest_streak, user.last_activity_date)


class StatsService:
    def __init__(self, ctx: ServiceContext) -> None:
        self._ctx = ctx
        self._xp = XpRepository(ctx.session)

    def total_xp(self, user: User) -> int:
        return self._xp.total_xp(user.id)

    def daily(self, user: User) -> DailyGoalOut:
        """Today's XP is a query over the ledger — there is no separate daily counter."""
        daily_xp = self._xp.xp_on(user.id, self._ctx.today())
        return DailyGoalOut(
            daily_xp=daily_xp,
            daily_goal=user.daily_goal_xp,
            daily_goal_completed=daily_xp >= user.daily_goal_xp,
        )

    def streak(self, user: User) -> StreakOut:
        state = streak_state(user)
        today = self._ctx.today()
        return StreakOut(
            current=streak_rules.displayed_streak(state, today, user.streak_freezes),
            longest=state.longest,
            active_today=streak_rules.is_active_today(state, today),
        )

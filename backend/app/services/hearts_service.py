"""Hearts: lazy regeneration on read, loss on wrong answers, gem-funded refill.

Reads compute the regenerated value without writing; the regenerated value is persisted the next
time hearts change (a wrong answer or a refill).
"""

from app.domain import hearts as rules
from app.domain.hearts import HeartState
from app.domain.rules import HEART_REFILL_COST_GEMS, HEART_REGEN_INTERVAL, MAX_HEARTS
from app.models import User
from app.schemas.common import HeartsOut
from app.schemas.gamification import RefillOut
from app.services.context import ServiceContext


def hearts_out(state: HeartState) -> HeartsOut:
    return HeartsOut(
        current=state.hearts,
        max=MAX_HEARTS,
        next_heart_at=rules.next_heart_at(state),
        regen_minutes=int(HEART_REGEN_INTERVAL.total_seconds() // 60),
        refill_cost_gems=HEART_REFILL_COST_GEMS,
    )


class HeartsService:
    def __init__(self, ctx: ServiceContext) -> None:
        self._ctx = ctx

    def current(self, user: User) -> HeartState:
        return rules.regenerate(self._stored(user), self._ctx.now())

    def view(self, user: User) -> HeartsOut:
        return hearts_out(self.current(user))

    def require_hearts(self, user: User) -> None:
        rules.ensure_has_hearts(self._stored(user), self._ctx.now())

    def lose_heart(self, user: User) -> None:
        """Deduct one heart. Part of the caller's transaction (does not commit)."""
        self._apply(user, rules.lose_heart(self._stored(user), self._ctx.now()))

    def refill(self, user: User) -> RefillOut:
        self.apply_refill(user)
        self._ctx.session.commit()
        return RefillOut(hearts=self.view(user), gems=user.gems)

    def apply_refill(self, user: User) -> None:
        """Spend gems for full hearts. Part of the caller's transaction (does not commit)."""
        result = rules.refill(self._stored(user), user.gems, self._ctx.now())
        self._apply(user, result.hearts)
        user.gems = result.gems

    @staticmethod
    def _stored(user: User) -> HeartState:
        return HeartState(user.hearts, user.hearts_updated_at)

    @staticmethod
    def _apply(user: User, state: HeartState) -> None:
        user.hearts = state.hearts
        user.hearts_updated_at = state.updated_at

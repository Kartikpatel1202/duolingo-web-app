"""One-time reward claims, streak-freeze uses and shop purchases (all append-only facts)."""

from collections.abc import Sequence
from datetime import date, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import RewardClaim, ShopPurchase, StreakFreezeUse


class RewardRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def claimed_keys(self, user_id: int, prefix: str = "") -> set[str]:
        statement = select(RewardClaim.reward_key).where(
            RewardClaim.user_id == user_id, RewardClaim.reward_key.startswith(prefix)
        )
        return set(self._session.scalars(statement).all())

    def add_claim(self, user_id: int, reward_key: str, gems: int, claimed_at: datetime) -> None:
        self._session.add(
            RewardClaim(user_id=user_id, reward_key=reward_key, gems=gems, claimed_at=claimed_at)
        )

    def add_freeze_uses(self, user_id: int, days: Sequence[date]) -> None:
        for day in days:
            self._session.add(StreakFreezeUse(user_id=user_id, used_on=day))

    def freeze_days(self, user_id: int, first_day: date, last_day: date) -> set[date]:
        statement = select(StreakFreezeUse.used_on).where(
            StreakFreezeUse.user_id == user_id,
            StreakFreezeUse.used_on.between(first_day, last_day),
        )
        return set(self._session.scalars(statement).all())

    def purchase(self, user_id: int, purchase_id: str) -> ShopPurchase | None:
        statement = select(ShopPurchase).where(
            ShopPurchase.user_id == user_id, ShopPurchase.purchase_id == purchase_id
        )
        return self._session.scalars(statement).one_or_none()

    def add_purchase(
        self, user_id: int, purchase_id: str, item_id: str, price_gems: int, purchased_at: datetime
    ) -> None:
        self._session.add(
            ShopPurchase(
                user_id=user_id,
                purchase_id=purchase_id,
                item_id=item_id,
                price_gems=price_gems,
                purchased_at=purchased_at,
            )
        )

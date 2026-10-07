"""Gem shop. Purchases change real learner state; there is no payment system."""

from sqlalchemy.exc import IntegrityError

from app.domain import shop
from app.domain.errors import ShopItemNotFound
from app.domain.shop import CATALOG, ShopItemId
from app.models import User
from app.repositories.reward_repository import RewardRepository
from app.schemas.engagement import PurchaseOut, ShopItemOut, ShopOut
from app.services.context import ServiceContext
from app.services.hearts_service import HeartsService


class ShopService:
    def __init__(self, ctx: ServiceContext) -> None:
        self._ctx = ctx
        self._hearts = HeartsService(ctx)
        self._purchases = RewardRepository(ctx.session)

    def catalog(self, user: User) -> ShopOut:
        return ShopOut(gems=user.gems, items=[self._item(user, item_id) for item_id in CATALOG])

    def purchase(self, user: User, item_id: ShopItemId, purchase_id: str) -> PurchaseOut:
        """Charge gems and apply the item in one transaction; a repeated purchase_id is a no-op."""
        previous = self._purchases.purchase(user.id, purchase_id)
        if previous is not None:
            return self._result(user, ShopItemId(previous.item_id), replayed=True)

        if item_id is ShopItemId.STREAK_FREEZE:
            user.streak_freezes, user.gems = shop.buy_streak_freeze(user.streak_freezes, user.gems)
        elif item_id is ShopItemId.HEART_REFILL:
            self._hearts.apply_refill(user)  # same rule as POST /api/hearts/refill
        else:  # pragma: no cover - guarded by the enum
            raise ShopItemNotFound(item=item_id)
        self._purchases.add_purchase(
            user.id, purchase_id, item_id.value, CATALOG[item_id].price_gems, self._ctx.now()
        )
        try:
            self._ctx.session.commit()
        except IntegrityError:
            # A concurrent request with the same purchase_id won the race: nothing was charged here.
            self._ctx.session.rollback()
            return self._result(user, item_id, replayed=True)
        return self._result(user, item_id, replayed=False)

    def _result(self, user: User, item_id: ShopItemId, *, replayed: bool) -> PurchaseOut:
        return PurchaseOut(
            item_id=item_id,
            replayed=replayed,
            gems=user.gems,
            streak_freezes=user.streak_freezes,
            hearts=self._hearts.view(user),
        )

    def _item(self, user: User, item_id: ShopItemId) -> ShopItemOut:
        item = CATALOG[item_id]
        reason: str | None = None
        owned: int | None = None
        if item_id is ShopItemId.STREAK_FREEZE:
            owned = user.streak_freezes
            if item.max_owned is not None and owned >= item.max_owned:
                reason = "Fully equipped"
        elif item_id is ShopItemId.HEART_REFILL and self._hearts.current(user).is_full:
            reason = "Hearts are full"
        if reason is None and user.gems < item.price_gems:
            reason = "Not enough gems"
        return ShopItemOut(
            id=item.id,
            name=item.name,
            description=item.description,
            price_gems=item.price_gems,
            owned=owned,
            max_owned=item.max_owned,
            available=reason is None,
            unavailable_reason=reason,
        )

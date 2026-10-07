"""Shop catalog and purchase rules (gems only — no real payments).

Only items with a real effect are purchasable: streak freezes (inventory on the learner) and a
heart refill (same rule as POST /api/hearts/refill). Everything else in the shop UI is a clearly
labelled preview.
"""

from dataclasses import dataclass
from enum import StrEnum

from app.domain.errors import InsufficientGems, ItemLimitReached
from app.domain.rules import HEART_REFILL_COST_GEMS, MAX_STREAK_FREEZES, STREAK_FREEZE_PRICE_GEMS


class ShopItemId(StrEnum):
    STREAK_FREEZE = "streak_freeze"
    HEART_REFILL = "heart_refill"


@dataclass(frozen=True)
class ShopItem:
    id: ShopItemId
    name: str
    description: str
    price_gems: int
    max_owned: int | None  # inventory items have a cap; consumables apply immediately


CATALOG: dict[ShopItemId, ShopItem] = {
    ShopItemId.STREAK_FREEZE: ShopItem(
        ShopItemId.STREAK_FREEZE,
        "Streak Freeze",
        "Protects your streak for one missed day.",
        STREAK_FREEZE_PRICE_GEMS,
        MAX_STREAK_FREEZES,
    ),
    ShopItemId.HEART_REFILL: ShopItem(
        ShopItemId.HEART_REFILL,
        "Refill Hearts",
        "Get all your hearts back right now.",
        HEART_REFILL_COST_GEMS,
        None,
    ),
}


def buy_streak_freeze(owned: int, gems: int) -> tuple[int, int]:
    """New (owned, gems) after buying one streak freeze."""
    item = CATALOG[ShopItemId.STREAK_FREEZE]
    if item.max_owned is not None and owned >= item.max_owned:
        raise ItemLimitReached(item=item.id, max_owned=item.max_owned)
    if gems < item.price_gems:
        raise InsufficientGems(required=item.price_gems, available=gems)
    return owned + 1, gems - item.price_gems

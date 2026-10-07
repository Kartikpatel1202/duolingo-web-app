"""Streak calendar, shop, quests, rewards and feed contracts."""

from datetime import date, datetime
from typing import Literal

from pydantic import Field

from app.domain.shop import ShopItemId
from app.schemas.common import ApiModel, HeartsOut


class StreakSocietyOut(ApiModel):
    threshold: int
    unlocked: bool
    days_to_go: int


class StreakCalendarOut(ApiModel):
    current: int
    longest: int
    active_today: bool
    freezes_owned: int
    freezes_max: int
    month: str = Field(description="YYYY-MM of the calendar returned.", examples=["2026-10"])
    today: date
    practiced_days: list[date] = Field(description="Days in the month with a completed lesson.")
    freeze_days: list[date] = Field(description="Days in the month covered by a streak freeze.")
    days_practiced: int
    freezes_used: int
    society: StreakSocietyOut


class ShopItemOut(ApiModel):
    id: ShopItemId
    name: str
    description: str
    price_gems: int
    owned: int | None = Field(description="Inventory count for items you keep; null otherwise.")
    max_owned: int | None
    available: bool
    unavailable_reason: str | None = Field(description="Why it can't be bought right now.")


class ShopOut(ApiModel):
    gems: int
    items: list[ShopItemOut]


class PurchaseIn(ApiModel):
    item_id: ShopItemId
    purchase_id: str = Field(
        min_length=8,
        max_length=64,
        description="Client-generated id (UUID). A retry with the same id never charges twice.",
    )


class PurchaseOut(ApiModel):
    item_id: ShopItemId
    replayed: bool = Field(description="True when this purchase_id had already been processed.")
    gems: int
    streak_freezes: int
    hearts: HeartsOut


class QuestOut(ApiModel):
    code: str
    title: str
    progress: int
    target: int
    reward_gems: int
    completed: bool
    claimed: bool


class QuestsOut(ApiModel):
    day: date
    resets_at: datetime = Field(description="Local midnight: daily quests renew.")
    next_week_at: datetime = Field(description="When weekly content is revealed.")
    quests: list[QuestOut]


class ClaimOut(ApiModel):
    gems_awarded: int
    gems: int


class FeedItemOut(ApiModel):
    id: str
    kind: Literal["achievement", "league", "streak", "tip"]
    label: str = Field(examples=["CULTURE", "LEAGUE"])
    title: str
    body: str
    actor_name: str | None
    actor_color: str | None
    occurred_at: datetime | None


class FeedOut(ApiModel):
    items: list[FeedItemOut]

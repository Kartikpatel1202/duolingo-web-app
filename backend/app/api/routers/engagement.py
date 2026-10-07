"""Streak calendar, shop, quests, rewards and feed."""

from typing import Annotated

from fastapi import APIRouter, Query

from app.api.deps import (
    CurrentUser,
    FeedServiceDep,
    QuestServiceDep,
    RewardServiceDep,
    ShopServiceDep,
    StreakServiceDep,
)
from app.api.responses import errors
from app.schemas.engagement import (
    ClaimOut,
    FeedOut,
    PurchaseIn,
    PurchaseOut,
    QuestsOut,
    ShopOut,
    StreakCalendarOut,
)

router = APIRouter()


@router.get("/streak", summary="Streak with a month calendar", tags=["streak"], responses=errors())
def get_streak(
    user: CurrentUser,
    service: StreakServiceDep,
    month: Annotated[str | None, Query(pattern=r"^\d{4}-\d{2}$", examples=["2026-10"])] = None,
) -> StreakCalendarOut:
    return service.calendar(user, month)


@router.get("/shop", summary="Shop items and gem balance", tags=["shop"])
def get_shop(user: CurrentUser, service: ShopServiceDep) -> ShopOut:
    return service.catalog(user)


@router.post(
    "/shop/purchase",
    summary="Buy an item with gems (idempotent per purchase_id)",
    tags=["shop"],
    responses=errors(409),
)
def purchase(body: PurchaseIn, user: CurrentUser, service: ShopServiceDep) -> PurchaseOut:
    return service.purchase(user, body.item_id, body.purchase_id)


@router.get("/quests", summary="Today's quests with progress", tags=["quests"])
def get_quests(user: CurrentUser, service: QuestServiceDep) -> QuestsOut:
    return service.daily(user)


@router.post(
    "/quests/{code}/claim",
    summary="Claim a completed quest's reward (once per day)",
    tags=["quests"],
    responses=errors(404, 409),
)
def claim_quest(code: str, user: CurrentUser, service: QuestServiceDep) -> ClaimOut:
    return service.claim(user, code)


@router.post(
    "/units/{unit_id}/chest/claim",
    summary="Open a completed unit's treasure chest (once)",
    tags=["rewards"],
    responses=errors(404, 409),
)
def claim_chest(unit_id: int, user: CurrentUser, service: RewardServiceDep) -> ClaimOut:
    return service.claim_unit_chest(user, unit_id)


@router.get("/feed", summary="Activity feed", tags=["feed"])
def get_feed(user: CurrentUser, service: FeedServiceDep) -> FeedOut:
    return service.feed(user)

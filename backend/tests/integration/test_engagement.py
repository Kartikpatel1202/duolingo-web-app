"""Streak calendar & freezes, shop, quests, unit chests, league, feed — through the API."""

from datetime import timedelta
from itertools import count
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.clock import FixedClock
from app.domain.rules import STREAK_FREEZE_PRICE_GEMS
from app.models import RewardClaim, ShopPurchase, User
from tests.helpers import Api

DAY = timedelta(days=1)


_purchase_ids = count(1)


def buy(api: Api, item: str, purchase_id: str | None = None) -> Any:
    """Each call is a new purchase intent unless the caller repeats a purchase_id (a retry)."""
    purchase_id = purchase_id or f"purchase-{next(_purchase_ids):04d}"
    return api.client.post("/api/shop/purchase", json={"item_id": item, "purchase_id": purchase_id})


def learner(db: Session) -> User:
    db.expire_all()
    return db.scalars(select(User).where(User.username == "learner")).one()


# --- streak calendar ---------------------------------------------------------------------------


def test_streak_calendar_lists_practiced_days(api: Api, clock: FixedClock) -> None:
    api.play(api.lesson_id(1, 1, 1))
    clock.advance(DAY)
    api.play(api.lesson_id(1, 1, 2))

    streak = api.get("/api/streak")
    assert streak["month"] == "2026-10"
    assert streak["practiced_days"] == ["2026-10-07", "2026-10-08"]
    assert streak["days_practiced"] == 2
    assert streak["current"] == 2
    assert streak["society"] == {"threshold": 7, "unlocked": False, "days_to_go": 5}

    assert api.get("/api/streak?month=2026-09")["practiced_days"] == []


def test_streak_calendar_rejects_a_bad_month(api: Api) -> None:
    response = api.client.get("/api/streak?month=October")
    assert response.status_code == 422


def test_a_streak_freeze_covers_a_missed_day(api: Api, clock: FixedClock, db: Session) -> None:
    assert buy(api, "streak_freeze").status_code == 200
    api.play(api.lesson_id(1, 1, 1))  # day 1 — streak 1
    clock.advance(2 * DAY)  # day 2 missed

    assert api.get("/api/users/me")["streak"]["current"] == 1  # alive thanks to the freeze
    result = api.play(api.lesson_id(1, 1, 2))  # day 3
    assert result["streak"]["current"] == 2
    assert learner(db).streak_freezes == 0  # consumed

    calendar = api.get("/api/streak")
    assert calendar["freeze_days"] == ["2026-10-08"]
    assert calendar["freezes_used"] == 1


def test_without_a_freeze_a_missed_day_resets(api: Api, clock: FixedClock) -> None:
    api.play(api.lesson_id(1, 1, 1))
    clock.advance(2 * DAY)
    assert api.get("/api/users/me")["streak"]["current"] == 0
    assert api.play(api.lesson_id(1, 1, 2))["streak"]["current"] == 1


# --- shop -----------------------------------------------------------------------------------------


def test_shop_lists_items_with_availability(api: Api) -> None:
    shop = api.get("/api/shop")
    assert shop["gems"] == 500
    items = {item["id"]: item for item in shop["items"]}
    assert items["streak_freeze"]["available"] is True
    assert items["streak_freeze"]["owned"] == 0
    assert items["heart_refill"]["available"] is False
    assert items["heart_refill"]["unavailable_reason"] == "Hearts are full"


def test_buying_streak_freezes_until_fully_equipped(api: Api) -> None:
    first = buy(api, "streak_freeze").json()
    assert (first["gems"], first["streak_freezes"]) == (400, 1)
    assert buy(api, "streak_freeze").json()["streak_freezes"] == 2
    third = buy(api, "streak_freeze")
    assert third.status_code == 409
    assert third.json()["error"]["code"] == "ITEM_LIMIT_REACHED"
    assert api.get("/api/users/me")["gems"] == 300


def test_heart_refill_through_the_shop_uses_the_heart_rules(api: Api) -> None:
    full = buy(api, "heart_refill")
    assert full.status_code == 409
    assert full.json()["error"]["code"] == "HEARTS_FULL"


def test_a_retried_purchase_is_charged_once(api: Api, db: Session) -> None:
    gems = api.get("/api/users/me")["gems"]
    first = buy(api, "streak_freeze", "retry-0001")
    retry = buy(api, "streak_freeze", "retry-0001")

    assert first.status_code == retry.status_code == 200
    assert first.json()["replayed"] is False
    assert retry.json()["replayed"] is True
    assert retry.json()["gems"] == gems - STREAK_FREEZE_PRICE_GEMS
    assert retry.json()["streak_freezes"] == 1
    purchases = db.scalars(select(ShopPurchase)).all()
    assert [(p.item_id, p.price_gems) for p in purchases] == [
        ("streak_freeze", STREAK_FREEZE_PRICE_GEMS)
    ]


def test_a_rejected_purchase_charges_nothing_and_is_not_recorded(api: Api, db: Session) -> None:
    gems = api.get("/api/users/me")["gems"]
    response = buy(api, "heart_refill")  # hearts are full

    assert response.status_code == 409
    assert api.get("/api/users/me")["gems"] == gems
    assert db.scalars(select(ShopPurchase)).all() == []


def test_purchase_requires_an_idempotency_key(api: Api) -> None:
    response = api.client.post("/api/shop/purchase", json={"item_id": "streak_freeze"})
    assert response.status_code == 422


def test_unknown_items_are_rejected(api: Api) -> None:
    assert buy(api, "rocket").status_code == 422


# --- quests ---------------------------------------------------------------------------------------


def quests(api: Api) -> dict[str, Any]:
    return {quest["code"]: quest for quest in api.get("/api/quests")["quests"]}


def test_quest_progress_comes_from_todays_activity(api: Api) -> None:
    before = quests(api)
    assert before["daily_lesson"]["progress"] == 0
    api.play(api.lesson_id(1, 1, 1))  # perfect, 15 XP
    after = quests(api)
    assert after["daily_lesson"] | {"progress": 1, "completed": True} == after["daily_lesson"]
    assert after["daily_perfect"]["completed"] is True
    assert after["daily_xp"]["progress"] == 15
    assert after["daily_xp"]["completed"] is False


def test_claiming_a_quest_once(api: Api, db: Session) -> None:
    early = api.client.post("/api/quests/daily_lesson/claim")
    assert early.status_code == 409
    assert early.json()["error"]["code"] == "REWARD_NOT_AVAILABLE"

    api.play(api.lesson_id(1, 1, 1))
    claim = api.client.post("/api/quests/daily_lesson/claim").json()
    assert claim == {"gems_awarded": 10, "gems": 515}
    again = api.client.post("/api/quests/daily_lesson/claim")
    assert again.json()["error"]["code"] == "REWARD_ALREADY_CLAIMED"
    assert db.scalar(select(func.count()).select_from(RewardClaim)) == 1
    assert quests(api)["daily_lesson"]["claimed"] is True


def test_quests_reset_at_midnight(api: Api, clock: FixedClock) -> None:
    api.play(api.lesson_id(1, 1, 1))
    api.client.post("/api/quests/daily_lesson/claim")
    clock.advance(DAY)
    fresh = quests(api)["daily_lesson"]
    assert (fresh["progress"], fresh["claimed"]) == (0, False)


def test_unknown_quest(api: Api) -> None:
    assert api.client.post("/api/quests/nope/claim").status_code == 404


# --- unit chests ----------------------------------------------------------------------------------


def test_unit_chest_unlocks_when_every_skill_is_complete(api: Api) -> None:
    unit = api.get("/api/courses/1/path")["units"][0]
    assert unit["chest"] == {"status": "locked", "reward_gems": 20}
    locked = api.client.post(f"/api/units/{unit['id']}/chest/claim")
    assert locked.json()["error"]["code"] == "REWARD_NOT_AVAILABLE"

    lessons = api.unit_lesson_ids(1)
    for lesson_id in lessons[:-1]:
        api.play(lesson_id)
    # One lesson short of the unit: the chest stays shut.
    assert api.get("/api/courses/1/path")["units"][0]["chest"]["status"] == "locked"
    api.play(lessons[-1])
    assert api.get("/api/courses/1/path")["units"][0]["chest"]["status"] == "available"

    gems = api.get("/api/users/me")["gems"]
    opened = api.client.post(f"/api/units/{unit['id']}/chest/claim").json()
    assert opened == {"gems_awarded": 20, "gems": gems + 20}
    assert api.get("/api/courses/1/path")["units"][0]["chest"]["status"] == "claimed"
    assert api.client.post(f"/api/units/{unit['id']}/chest/claim").status_code == 409


# --- league & profile -----------------------------------------------------------------------------


def test_leaderboard_has_a_league_with_zones(api: Api) -> None:
    board = api.get("/api/leaderboard")
    assert board["league"] == {"name": "Silver League", "promotion_spots": 3, "demotion_spots": 2}
    zones = [row["zone"] for row in board["entries"]]
    assert zones[:3] == ["promotion"] * 3
    assert zones[-2:] == ["demotion"] * 2
    assert set(zones[3:-2]) == {None}


def test_top_finishes_count_past_weeks_in_the_promotion_zone(api: Api, clock: FixedClock) -> None:
    clock.advance(7 * DAY)  # next week: rivals have no XP yet
    api.play(api.lesson_id(1, 1, 1))
    assert api.get("/api/profile")["stats"]["top_finishes"] == 0  # the week isn't over
    clock.advance(7 * DAY)
    assert api.get("/api/profile")["stats"]["top_finishes"] == 1


# --- feed ----------------------------------------------------------------------------------


def test_feed_is_built_from_real_data_and_is_deterministic(api: Api) -> None:
    api.play(api.lesson_id(1, 1, 1))
    feed = api.get("/api/feed")["items"]
    kinds = {item["kind"] for item in feed}
    assert {"league", "tip", "achievement"} <= kinds
    assert any(item["title"] == "You unlocked First Steps" for item in feed)
    assert any(item["title"].startswith("María earned") for item in feed)
    assert api.get("/api/feed")["items"] == feed

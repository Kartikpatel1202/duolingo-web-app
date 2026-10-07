"""Pure rules behind streak freezes, the shop, quests, league zones and feed tips."""

from datetime import date, timedelta

import pytest

from app.domain.errors import InsufficientGems, ItemLimitReached
from app.domain.feed import TIPS, tips_for
from app.domain.leaderboard import league_zone
from app.domain.quests import DAILY_QUESTS, QuestMetric, is_complete, progress
from app.domain.rewards import quest_reward_key, unit_chest_key
from app.domain.shop import buy_streak_freeze
from app.domain.streak import (
    StreakState,
    displayed_streak,
    freezes_to_consume,
    missed_days,
    record_activity,
)

TODAY = date(2026, 10, 7)
DAY = timedelta(days=1)

# --- streak freezes ----------------------------------------------------------------------------


def test_missed_days_are_the_days_strictly_between() -> None:
    assert missed_days(TODAY - 3 * DAY, TODAY) == [TODAY - 2 * DAY, TODAY - DAY]
    assert missed_days(TODAY - DAY, TODAY) == []


def test_a_freeze_keeps_the_streak_alive_on_read() -> None:
    state = StreakState(5, 5, TODAY - 2 * DAY)  # yesterday was missed
    assert displayed_streak(state, TODAY) == 0
    assert displayed_streak(state, TODAY, freezes_available=1) == 5


def test_completion_consumes_exactly_the_freezes_needed() -> None:
    state = StreakState(5, 5, TODAY - 3 * DAY)  # two missed days
    assert freezes_to_consume(state, TODAY, 2) == [TODAY - 2 * DAY, TODAY - DAY]
    assert record_activity(state, TODAY, 2) == StreakState(6, 6, TODAY)


def test_not_enough_freezes_resets_and_consumes_none() -> None:
    state = StreakState(5, 5, TODAY - 3 * DAY)
    assert freezes_to_consume(state, TODAY, 1) == []
    assert record_activity(state, TODAY, 1) == StreakState(1, 5, TODAY)


def test_no_freeze_needed_on_consecutive_days() -> None:
    assert freezes_to_consume(StreakState(3, 3, TODAY - DAY), TODAY, 2) == []


# --- shop ---------------------------------------------------------------------------------------


def test_buying_a_freeze_spends_gems() -> None:
    assert buy_streak_freeze(owned=0, gems=150) == (1, 50)


def test_freezes_are_capped() -> None:
    with pytest.raises(ItemLimitReached):
        buy_streak_freeze(owned=2, gems=1000)


def test_freezes_need_enough_gems() -> None:
    with pytest.raises(InsufficientGems):
        buy_streak_freeze(owned=0, gems=99)


# --- quests and reward keys ----------------------------------------------------------------------


def test_quest_progress_is_capped_at_the_target() -> None:
    xp_quest = next(q for q in DAILY_QUESTS if q.metric is QuestMetric.XP_TODAY)
    assert progress(xp_quest, {QuestMetric.XP_TODAY: 999}) == xp_quest.target
    assert not is_complete(xp_quest, {QuestMetric.XP_TODAY: xp_quest.target - 1})
    assert is_complete(xp_quest, {QuestMetric.XP_TODAY: xp_quest.target})


def test_reward_keys_are_per_day_and_per_unit() -> None:
    assert quest_reward_key("daily_xp", TODAY) == "quest:daily_xp:2026-10-07"
    assert quest_reward_key("daily_xp", TODAY + DAY) != quest_reward_key("daily_xp", TODAY)
    assert unit_chest_key(3) == "chest:unit:3"


# --- league zones and tips -----------------------------------------------------------------------


@pytest.mark.parametrize(
    ("rank", "zone"),
    [(1, "promotion"), (3, "promotion"), (4, None), (8, None), (9, "demotion"), (10, "demotion")],
)
def test_league_zones(rank: int, zone: str | None) -> None:
    assert league_zone(rank, 10, promotion_spots=3, demotion_spots=2) == zone


def test_small_leagues_have_no_overlapping_zones() -> None:
    assert league_zone(3, 3, promotion_spots=3, demotion_spots=2) == "promotion"


def test_tips_rotate_daily_but_are_stable_within_a_day() -> None:
    assert tips_for(TODAY, 3) == tips_for(TODAY, 3)
    assert tips_for(TODAY, 3) != tips_for(TODAY + DAY, 3)
    assert len(tips_for(TODAY, 99)) == len(TIPS)

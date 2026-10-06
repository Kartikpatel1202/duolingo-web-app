from datetime import UTC, datetime, timedelta

import pytest

from app.domain.errors import HeartsFull, InsufficientGems, OutOfHearts
from app.domain.hearts import (
    HeartState,
    ensure_has_hearts,
    lose_heart,
    next_heart_at,
    refill,
    regenerate,
)
from app.domain.rules import HEART_REFILL_COST_GEMS, MAX_HEARTS

T0 = datetime(2026, 10, 7, 10, 0, tzinfo=UTC)
MINUTE = timedelta(minutes=1)


def test_losing_first_heart_starts_the_regeneration_clock() -> None:
    state = lose_heart(HeartState(MAX_HEARTS, T0 - timedelta(days=3)), T0)
    assert state == HeartState(MAX_HEARTS - 1, T0)
    assert next_heart_at(state) == T0 + 30 * MINUTE


def test_losing_another_heart_keeps_regeneration_progress() -> None:
    state = lose_heart(HeartState(3, T0), T0 + 10 * MINUTE)
    assert state == HeartState(2, T0)


def test_cannot_go_below_zero() -> None:
    with pytest.raises(OutOfHearts):
        lose_heart(HeartState(0, T0), T0)
    with pytest.raises(OutOfHearts):
        ensure_has_hearts(HeartState(0, T0), T0 + 29 * MINUTE)


@pytest.mark.parametrize(
    ("elapsed_minutes", "expected_hearts", "expected_anchor_minutes"),
    [
        (0, 2, 0),
        (29, 2, 0),
        (30, 3, 30),
        (45, 3, 30),  # partial progress towards the next heart is kept
        (61, 4, 60),
        (90, 5, 90),
        (600, 5, 90),  # capped at the maximum
    ],
)
def test_regeneration(
    elapsed_minutes: int, expected_hearts: int, expected_anchor_minutes: int
) -> None:
    state = regenerate(HeartState(2, T0), T0 + elapsed_minutes * MINUTE)
    assert state.hearts == expected_hearts
    if expected_hearts < MAX_HEARTS:
        assert state.updated_at == T0 + expected_anchor_minutes * MINUTE


def test_full_hearts_have_no_next_heart() -> None:
    assert next_heart_at(regenerate(HeartState(MAX_HEARTS, T0), T0)) is None


def test_zero_hearts_regenerate_back_into_play() -> None:
    assert ensure_has_hearts(HeartState(0, T0), T0 + 30 * MINUTE).hearts == 1


def test_refill_costs_gems_and_fills() -> None:
    result = refill(HeartState(1, T0), gems=120, now=T0)
    assert result.hearts.hearts == MAX_HEARTS
    assert result.gems == 120 - HEART_REFILL_COST_GEMS


def test_refill_rejected_when_full() -> None:
    with pytest.raises(HeartsFull):
        refill(HeartState(MAX_HEARTS, T0), gems=1000, now=T0)


def test_refill_rejected_when_regeneration_already_filled_hearts() -> None:
    with pytest.raises(HeartsFull):
        refill(HeartState(4, T0), gems=1000, now=T0 + 30 * MINUTE)


def test_refill_rejected_without_enough_gems() -> None:
    with pytest.raises(InsufficientGems) as error:
        refill(HeartState(0, T0), gems=HEART_REFILL_COST_GEMS - 1, now=T0)
    assert error.value.details == {
        "required": HEART_REFILL_COST_GEMS,
        "available": HEART_REFILL_COST_GEMS - 1,
    }

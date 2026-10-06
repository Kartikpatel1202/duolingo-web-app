"""Heart rules: loss, lazy regeneration and refill.

Hearts are persisted as (count, anchor timestamp). The effective count at any instant is computed
from those two values, so no background job is needed and reads never have to write.
"""

from dataclasses import dataclass
from datetime import datetime

from app.domain.errors import HeartsFull, InsufficientGems, OutOfHearts
from app.domain.rules import HEART_REFILL_COST_GEMS, HEART_REGEN_INTERVAL, MAX_HEARTS


@dataclass(frozen=True)
class HeartState:
    hearts: int
    updated_at: datetime  # regeneration anchor

    @property
    def is_full(self) -> bool:
        return self.hearts >= MAX_HEARTS


def regenerate(state: HeartState, now: datetime) -> HeartState:
    """Apply every whole regeneration interval elapsed since the anchor, capped at MAX_HEARTS.

    The anchor advances by the consumed intervals only, so partial progress towards the next
    heart is preserved.
    """
    if state.is_full:
        return HeartState(MAX_HEARTS, state.updated_at)
    intervals = int((now - state.updated_at) // HEART_REGEN_INTERVAL)
    if intervals <= 0:
        return state
    hearts = min(MAX_HEARTS, state.hearts + intervals)
    return HeartState(hearts, state.updated_at + HEART_REGEN_INTERVAL * intervals)


def next_heart_at(state: HeartState) -> datetime | None:
    """When the next heart arrives, for an already-regenerated state; None when full."""
    return None if state.is_full else state.updated_at + HEART_REGEN_INTERVAL


def lose_heart(state: HeartState, now: datetime) -> HeartState:
    current = regenerate(state, now)
    if current.hearts <= 0:
        raise OutOfHearts()
    # Losing the first heart starts the regeneration clock; otherwise keep accumulated progress.
    anchor = now if current.is_full else current.updated_at
    return HeartState(current.hearts - 1, anchor)


def ensure_has_hearts(state: HeartState, now: datetime) -> HeartState:
    current = regenerate(state, now)
    if current.hearts <= 0:
        raise OutOfHearts(next_heart_at=next_heart_at(current))
    return current


@dataclass(frozen=True)
class RefillResult:
    hearts: HeartState
    gems: int


def refill(state: HeartState, gems: int, now: datetime) -> RefillResult:
    current = regenerate(state, now)
    if current.is_full:
        raise HeartsFull()
    if gems < HEART_REFILL_COST_GEMS:
        raise InsufficientGems(required=HEART_REFILL_COST_GEMS, available=gems)
    return RefillResult(HeartState(MAX_HEARTS, now), gems - HEART_REFILL_COST_GEMS)

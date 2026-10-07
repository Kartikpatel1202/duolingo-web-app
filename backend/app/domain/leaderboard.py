"""Weekly leaderboard rules.

Week: Monday 00:00 → next Monday 00:00 in APP_TIMEZONE. A new week is simply a new `week_start`
key, so there is no reset job ("lazy rollover"); past weeks remain as history.
"""

from collections.abc import Sequence
from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta
from typing import Literal

_NEVER = datetime.max.replace(tzinfo=UTC)


def week_start(day: date) -> date:
    return day - timedelta(days=day.weekday())


def next_week_start(day: date) -> date:
    return week_start(day) + timedelta(days=7)


@dataclass(frozen=True)
class Standing:
    user_id: int
    xp: int
    reached_at: datetime | None  # when the learner reached `xp`; None if no XP this week


@dataclass(frozen=True)
class RankedStanding:
    rank: int
    standing: Standing


def rank_standings(standings: Sequence[Standing]) -> list[RankedStanding]:
    """Deterministic ordering: more XP first; on a tie, whoever reached that XP first;
    then lowest user id. Ranks are positions (1..n), never shared."""
    ordered = sorted(standings, key=lambda s: (-s.xp, s.reached_at or _NEVER, s.user_id))
    return [RankedStanding(position, standing) for position, standing in enumerate(ordered, 1)]


Zone = Literal["promotion", "demotion"]


def league_zone(rank: int, size: int, promotion_spots: int, demotion_spots: int) -> Zone | None:
    """Promotion zone at the top, demotion zone at the bottom (the two never overlap)."""
    if rank <= promotion_spots:
        return "promotion"
    if rank > max(size - demotion_spots, promotion_spots):
        return "demotion"
    return None

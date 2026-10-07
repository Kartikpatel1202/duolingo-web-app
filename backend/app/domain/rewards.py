"""Keys for one-time rewards. A reward is claimed at most once per key (UNIQUE in the database)."""

from datetime import date


def quest_reward_key(quest_code: str, day: date) -> str:
    return f"quest:{quest_code}:{day.isoformat()}"


def unit_chest_key(unit_id: int) -> str:
    return f"chest:unit:{unit_id}"

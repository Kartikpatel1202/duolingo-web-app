"""Product rules. These are versioned with the code, not configured per environment."""

from datetime import timedelta
from typing import Final

MAX_HEARTS: Final = 5
HEART_REGEN_INTERVAL: Final = timedelta(minutes=30)
HEART_REFILL_COST_GEMS: Final = 50

DEFAULT_LESSON_XP: Final = 10
PERFECT_LESSON_BONUS_XP: Final = 5
FIRST_COMPLETION_GEMS: Final = 5

DAILY_GOAL_OPTIONS: Final = (10, 20, 30, 50)
DEFAULT_DAILY_GOAL_XP: Final = 20
STARTING_GEMS: Final = 500

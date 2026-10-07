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

# Legendary challenge (replay of a completed lesson under pressure)
LEGENDARY_TIME_LIMIT: Final = timedelta(seconds=150)
LEGENDARY_MISTAKE_LIMIT: Final = 3  # the third mistake ends the challenge
LEGENDARY_BONUS_XP: Final = 20  # awarded once per lesson

# Streak freezes (sold in the shop; each covers one missed day)
MAX_STREAK_FREEZES: Final = 2
STREAK_FREEZE_PRICE_GEMS: Final = 100
STREAK_SOCIETY_DAYS: Final = 7  # streak milestone shown on the streak screen

# Rewards
UNIT_CHEST_GEMS: Final = 20  # treasure chest at the end of a completed unit

# Weekly league (a single league tier in this app)
LEAGUE_NAME: Final = "Silver League"
LEAGUE_PROMOTION_SPOTS: Final = 3
LEAGUE_DEMOTION_SPOTS: Final = 2

# Accounts
MIN_PASSWORD_LENGTH: Final = 8
# Avatar colours handed out to new accounts in turn (design-token names used by the frontend).
AVATAR_COLORS: Final = ("sky", "leaf", "grape", "ember", "cherry", "sun")

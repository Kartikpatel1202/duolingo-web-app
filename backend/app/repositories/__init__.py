"""Named database queries, grouped by aggregate. Repositories contain no business rules."""

from app.repositories.achievement_repository import AchievementRepository
from app.repositories.attempt_repository import AttemptRepository
from app.repositories.content_repository import ContentRepository
from app.repositories.progress_repository import ProgressRepository
from app.repositories.reward_repository import RewardRepository
from app.repositories.user_repository import UserRepository
from app.repositories.xp_repository import XpRepository

__all__ = [
    "AchievementRepository",
    "AttemptRepository",
    "ContentRepository",
    "ProgressRepository",
    "RewardRepository",
    "UserRepository",
    "XpRepository",
]

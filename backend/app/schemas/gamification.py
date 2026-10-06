"""Hearts, leaderboard, profile and health schemas."""

from datetime import date, datetime
from typing import Literal

from app.domain.enums import AchievementMetric
from app.schemas.common import ApiModel, HeartsOut


class HealthOut(ApiModel):
    status: Literal["ok"]
    database: Literal["ok"]


class RefillOut(ApiModel):
    hearts: HeartsOut
    gems: int


class LeaderboardRowOut(ApiModel):
    rank: int
    user_id: int
    display_name: str
    avatar_color: str
    xp: int
    is_current_user: bool


class LeaderboardStandingOut(ApiModel):
    rank: int
    xp: int


class LeaderboardOut(ApiModel):
    week_start: date
    resets_at: datetime
    entries: list[LeaderboardRowOut]
    current_user: LeaderboardStandingOut


class ProfileUserOut(ApiModel):
    id: int
    username: str
    display_name: str
    avatar_color: str
    joined_at: datetime


class ProfileStatsOut(ApiModel):
    total_xp: int
    current_streak: int
    longest_streak: int
    lessons_completed: int
    skills_completed: int
    weekly_xp: int
    league_rank: int


class ProfileAchievementOut(ApiModel):
    code: str
    title: str
    description: str
    icon: str
    metric: AchievementMetric
    threshold: int
    progress: int
    earned_at: datetime | None


class ProfileOut(ApiModel):
    user: ProfileUserOut
    stats: ProfileStatsOut
    achievements: list[ProfileAchievementOut]


class ResetIn(ApiModel):
    demo_progress: bool = False

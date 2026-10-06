from typing import Literal

from pydantic import Field

from app.schemas.common import ApiModel, DailyGoalOut, HeartsOut, StreakOut


class CurrentUserOut(ApiModel):
    """Identity plus everything the top stats bar needs, in one request."""

    id: int
    username: str
    display_name: str
    avatar_color: str
    current_course_id: int | None
    total_xp: int
    gems: int
    hearts: HeartsOut
    streak: StreakOut
    daily: DailyGoalOut


class UpdateUserIn(ApiModel):
    daily_goal_xp: Literal[10, 20, 30, 50] = Field(description="Daily XP goal.")

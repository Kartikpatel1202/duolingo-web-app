"""Shapes shared by several endpoints."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ApiModel(BaseModel):
    """Base for every API schema. Built explicitly by services — never from ORM objects."""

    model_config = ConfigDict(frozen=True)


class ErrorDetail(ApiModel):
    code: str = Field(examples=["LESSON_LOCKED"])
    message: str = Field(examples=["This lesson is locked."])
    details: dict[str, Any] = Field(default_factory=dict)


class ErrorResponse(ApiModel):
    error: ErrorDetail


class HeartsOut(ApiModel):
    current: int = Field(ge=0)
    max: int
    next_heart_at: datetime | None = Field(
        description="When the next heart regenerates; null if full."
    )
    regen_minutes: int
    refill_cost_gems: int


class StreakOut(ApiModel):
    current: int = Field(ge=0, description="Displayed streak (0 once a day has been missed).")
    longest: int = Field(ge=0)
    active_today: bool = Field(description="Whether a lesson was completed today.")


class DailyGoalOut(ApiModel):
    daily_xp: int = Field(ge=0)
    daily_goal: int
    daily_goal_completed: bool

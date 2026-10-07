from datetime import date

from pydantic import Field

from app.domain.enums import AttemptMode, XpSource
from app.schemas.common import ApiModel, DailyGoalOut, HeartsOut, StreakOut
from app.schemas.course import SkillProgressOut


class CompleteLessonIn(ApiModel):
    attempt_id: str = Field(min_length=1, max_length=36)


class XpAwardOut(ApiModel):
    source: XpSource
    amount: int


class AchievementSummaryOut(ApiModel):
    code: str
    title: str
    description: str
    icon: str


class CompleteLessonOut(ApiModel):
    """Result of a completion. Repeating the request returns the same body."""

    attempt_id: str
    lesson_id: int
    mode: AttemptMode
    first_completion: bool
    xp_awarded: int
    xp_breakdown: list[XpAwardOut]
    gems_awarded: int
    mistakes: int
    accuracy: float
    total_xp: int
    gems: int
    daily: DailyGoalOut
    streak: StreakOut
    hearts: HeartsOut
    skill_progress: SkillProgressOut
    unlocked_skill_id: int | None = Field(description="Skill unlocked by this completion, if any.")
    next_lesson_id: int | None = Field(description="Where the path continues.")
    new_achievements: list[AchievementSummaryOut]


class DailyXpOut(ApiModel):
    date: date
    xp: int


class CourseProgressOut(ApiModel):
    course_id: int
    lessons_completed: int
    total_lessons: int
    skills_completed: int
    total_skills: int
    progress: float


class ProgressOut(ApiModel):
    total_xp: int
    daily: DailyGoalOut
    streak: StreakOut
    lessons_completed: int
    skills_completed: int
    courses: list[CourseProgressOut]
    last_7_days: list[DailyXpOut]

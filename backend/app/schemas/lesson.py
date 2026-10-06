from datetime import datetime

from pydantic import Field

from app.domain.enums import AttemptStatus
from app.schemas.common import ApiModel, HeartsOut
from app.schemas.exercise import AnswerIn, ExerciseOut


class LessonOut(ApiModel):
    """Everything needed to render a lesson — and nothing that reveals an answer."""

    id: int
    skill_id: int
    title: str | None
    xp_reward: int
    exercises: list[ExerciseOut]


class AttemptOut(ApiModel):
    attempt_id: str
    lesson_id: int
    status: AttemptStatus
    started_at: datetime
    solved_exercise_ids: list[int] = Field(description="Exercises already answered correctly.")
    mistakes: int
    total_exercises: int
    hearts: HeartsOut


class CheckAnswerIn(ApiModel):
    attempt_id: str = Field(min_length=1, max_length=36)
    exercise_id: int
    submission_id: str = Field(
        min_length=8,
        max_length=64,
        description="Client-generated id (e.g. UUID). Retrying with the same id is safe.",
    )
    answer: AnswerIn


class AttemptProgressOut(ApiModel):
    solved_count: int
    total_exercises: int
    mistakes: int
    can_complete: bool


class CheckAnswerOut(ApiModel):
    submission_id: str
    exercise_id: int
    is_correct: bool
    correct_answer: str = Field(description="Revealed only after the answer has been checked.")
    note: str | None = Field(description="Soft feedback, e.g. an accent reminder.")
    explanation: str | None
    hearts: HeartsOut
    attempt: AttemptProgressOut

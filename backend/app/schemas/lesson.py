from datetime import datetime

from pydantic import Field

from app.domain.enums import AttemptMode, AttemptStatus
from app.schemas.common import ApiModel, HeartsOut
from app.schemas.exercise import AnswerIn, ExerciseOut, RevealOut


class LessonOut(ApiModel):
    """Everything needed to render a lesson — and nothing that reveals an answer."""

    id: int
    skill_id: int
    title: str | None
    xp_reward: int
    exercises: list[ExerciseOut]


class StartAttemptIn(ApiModel):
    mode: AttemptMode = AttemptMode.STANDARD


class AttemptOut(ApiModel):
    attempt_id: str
    lesson_id: int
    mode: AttemptMode
    status: AttemptStatus
    started_at: datetime
    expires_at: datetime | None = Field(
        description="Deadline for timed challenges; null otherwise."
    )
    mistake_limit: int | None = Field(
        description="Mistakes allowed in a challenge; null otherwise."
    )
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
    status: AttemptStatus = Field(description="`failed` when a challenge just ended.")
    solved_count: int
    total_exercises: int
    mistakes: int
    mistakes_remaining: int | None = Field(description="Challenges only; null in standard lessons.")
    can_complete: bool


class CheckAnswerOut(ApiModel):
    submission_id: str
    exercise_id: int
    is_correct: bool
    heart_lost: bool = Field(description="Whether this answer cost a heart.")
    correct_answer: str = Field(description="Revealed only after the answer has been checked.")
    reveal: RevealOut = Field(description="Structured correct answer, for highlighting in the UI.")
    note: str | None = Field(description="Soft feedback, e.g. an accent reminder.")
    explanation: str | None
    hearts: HeartsOut
    attempt: AttemptProgressOut

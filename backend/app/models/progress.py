"""Learner progress facts: attempts, checked answers, lesson completions, skill milestones."""

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import JSON, CheckConstraint, ForeignKey, Index, String, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.db.types import UTCDateTime, str_enum
from app.domain.enums import AttemptStatus


def new_attempt_id() -> str:
    return str(uuid.uuid4())


class LessonAttempt(Base):
    """One play-through of a lesson: the integrity anchor for answer checks and completion.

    Solved exercises, mistakes and XP awarded are derived from `answers` and xp_events.
    The partial unique index allows at most one in-progress attempt per learner and lesson,
    so "start lesson" resumes instead of duplicating.
    """

    __tablename__ = "lesson_attempts"
    __table_args__ = (
        CheckConstraint(
            "(status = 'completed') = (completed_at IS NOT NULL)",
            name="completed_at_matches_status",
        ),
        Index("ix_lesson_attempts_user_id_lesson_id", "user_id", "lesson_id"),
        Index(
            "uq_lesson_attempts_one_active",
            "user_id",
            "lesson_id",
            unique=True,
            sqlite_where=text("status = 'in_progress'"),
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_attempt_id)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id", ondelete="RESTRICT"))
    status: Mapped[AttemptStatus] = mapped_column(
        str_enum(AttemptStatus, "attempt_status"), default=AttemptStatus.IN_PROGRESS
    )
    started_at: Mapped[datetime] = mapped_column(UTCDateTime)
    completed_at: Mapped[datetime | None] = mapped_column(UTCDateTime)

    answers: Mapped[list["AttemptAnswer"]] = relationship(
        back_populates="attempt",
        order_by="AttemptAnswer.id",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class AttemptAnswer(Base):
    """Every server-checked answer. `submission_id` is the client's idempotency key."""

    __tablename__ = "attempt_answers"
    __table_args__ = (
        UniqueConstraint("attempt_id", "submission_id"),
        Index("ix_attempt_answers_attempt_id_exercise_id", "attempt_id", "exercise_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    attempt_id: Mapped[str] = mapped_column(ForeignKey("lesson_attempts.id", ondelete="CASCADE"))
    exercise_id: Mapped[int] = mapped_column(ForeignKey("exercises.id", ondelete="RESTRICT"))
    submission_id: Mapped[str] = mapped_column(String(64))
    answer: Mapped[dict[str, Any]] = mapped_column(JSON)
    is_correct: Mapped[bool]
    created_at: Mapped[datetime] = mapped_column(UTCDateTime)

    attempt: Mapped[LessonAttempt] = relationship(back_populates="answers")


class UserLessonProgress(Base):
    """The fact "learner completed lesson X", written on the first completion only.

    UNIQUE(user_id, lesson_id) is the database-level guarantee that completion XP is awarded once.
    """

    __tablename__ = "user_lesson_progress"
    __table_args__ = (UniqueConstraint("user_id", "lesson_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id", ondelete="RESTRICT"))
    first_attempt_id: Mapped[str] = mapped_column(
        ForeignKey("lesson_attempts.id", ondelete="CASCADE"), unique=True
    )
    completed_at: Mapped[datetime] = mapped_column(UTCDateTime)


class UserSkillProgress(Base):
    """Skill milestones. `completed_at` unlocks the next skill and stays true even if lessons are
    added to the skill later. Lesson counts are computed from user_lesson_progress, not stored.
    """

    __tablename__ = "user_skill_progress"
    __table_args__ = (UniqueConstraint("user_id", "skill_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id", ondelete="RESTRICT"))
    started_at: Mapped[datetime] = mapped_column(UTCDateTime)
    completed_at: Mapped[datetime | None] = mapped_column(UTCDateTime)

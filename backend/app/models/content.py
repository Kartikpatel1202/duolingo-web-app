"""Course content: Course → Unit → Skill → Lesson → Exercise.

Content cascades downward. Learner rows reference content with ON DELETE RESTRICT (see
models/progress.py), so content with learner history can't be deleted by accident.
"""

from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, CheckConstraint, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.db.types import str_enum
from app.domain.enums import ExerciseType
from app.domain.rules import DEFAULT_LESSON_XP

if TYPE_CHECKING:
    from app.models.guidebook import Guidebook


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(64), unique=True)
    title: Mapped[str] = mapped_column(String(120))
    learning_language: Mapped[str] = mapped_column(String(8))
    from_language: Mapped[str] = mapped_column(String(8))
    description: Mapped[str | None] = mapped_column(Text)

    units: Mapped[list["Unit"]] = relationship(
        back_populates="course",
        order_by="Unit.position",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Unit(Base):
    __tablename__ = "units"
    __table_args__ = (
        UniqueConstraint("course_id", "position"),
        CheckConstraint("position >= 1", name="position_positive"),
        CheckConstraint("section >= 1", name="section_positive"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"))
    # Units are numbered across the whole course; `section` groups them into the course's parts.
    position: Mapped[int]
    section: Mapped[int] = mapped_column(default=1)
    title: Mapped[str] = mapped_column(String(120))
    description: Mapped[str | None] = mapped_column(String(255))
    theme: Mapped[str] = mapped_column(String(16))

    course: Mapped[Course] = relationship(back_populates="units")
    guidebook: Mapped["Guidebook | None"] = relationship(
        cascade="all, delete-orphan", passive_deletes=True, uselist=False
    )
    skills: Mapped[list["Skill"]] = relationship(
        back_populates="unit",
        order_by="Skill.position",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Skill(Base):
    __tablename__ = "skills"
    __table_args__ = (
        UniqueConstraint("unit_id", "position"),
        CheckConstraint("position >= 1", name="position_positive"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    unit_id: Mapped[int] = mapped_column(ForeignKey("units.id", ondelete="CASCADE"))
    position: Mapped[int]
    title: Mapped[str] = mapped_column(String(120))
    icon: Mapped[str] = mapped_column(String(32))
    description: Mapped[str | None] = mapped_column(String(255))

    unit: Mapped[Unit] = relationship(back_populates="skills")
    lessons: Mapped[list["Lesson"]] = relationship(
        back_populates="skill",
        order_by="Lesson.position",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Lesson(Base):
    __tablename__ = "lessons"
    __table_args__ = (
        UniqueConstraint("skill_id", "position"),
        CheckConstraint("position >= 1", name="position_positive"),
        CheckConstraint("xp_reward > 0", name="xp_reward_positive"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id", ondelete="CASCADE"))
    position: Mapped[int]
    title: Mapped[str | None] = mapped_column(String(120))
    xp_reward: Mapped[int] = mapped_column(default=DEFAULT_LESSON_XP)

    skill: Mapped[Skill] = relationship(back_populates="lessons")
    exercises: Mapped[list["Exercise"]] = relationship(
        back_populates="lesson",
        order_by="Exercise.position",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Exercise(Base):
    """One challenge. `content` is learner-visible; `solution` never leaves the server.

    Both JSON payloads are validated against the Pydantic models of the type's checker
    (app.domain.exercises) when content is seeded and whenever they are read.
    """

    __tablename__ = "exercises"
    __table_args__ = (
        UniqueConstraint("lesson_id", "position"),
        CheckConstraint("position >= 1", name="position_positive"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"))
    position: Mapped[int]
    type: Mapped[ExerciseType] = mapped_column(str_enum(ExerciseType, "exercise_type"))
    prompt: Mapped[str] = mapped_column(String(255))
    content: Mapped[dict[str, Any]] = mapped_column(JSON)
    solution: Mapped[dict[str, Any]] = mapped_column(JSON)
    explanation: Mapped[str | None] = mapped_column(Text)

    lesson: Mapped[Lesson] = relationship(back_populates="exercises")

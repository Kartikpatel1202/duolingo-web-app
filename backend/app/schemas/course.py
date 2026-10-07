from typing import Literal

from pydantic import Field

from app.domain.enums import (
    GuidebookEntryKind,
    GuidebookSectionKind,
    LessonStatus,
    SkillStatus,
)
from app.schemas.common import ApiModel


class CourseOut(ApiModel):
    id: int
    slug: str
    title: str
    learning_language: str
    from_language: str
    description: str | None


class CourseListOut(ApiModel):
    courses: list[CourseOut]


class CourseDetailOut(CourseOut):
    unit_count: int
    skill_count: int
    lesson_count: int
    completed_lesson_count: int


class SkillProgressOut(ApiModel):
    skill_id: int
    status: SkillStatus
    lessons_completed: int
    total_lessons: int
    progress: float  # 0.0 – 1.0


class PathSkillOut(ApiModel):
    id: int
    position: int
    title: str
    icon: str
    description: str | None
    status: SkillStatus
    lessons_completed: int
    total_lessons: int
    progress: float
    next_lesson_id: int | None  # null when locked; first lesson (practice) when completed
    legendary: bool  # every lesson of the skill has a won Legendary challenge


class UnitChestOut(ApiModel):
    """Treasure chest at the end of a unit: claimable once every skill is completed."""

    status: Literal["locked", "available", "claimed"]
    reward_gems: int


class PathUnitOut(ApiModel):
    id: int
    position: int
    section: int
    title: str
    description: str | None
    theme: str
    skills: list[PathSkillOut]
    chest: UnitChestOut


class PathOut(ApiModel):
    course: CourseOut
    current_skill_id: int | None  # the skill the learner should play next
    current_lesson_id: int | None
    units: list[PathUnitOut]


class SkillLessonOut(ApiModel):
    id: int
    position: int
    title: str | None
    xp_reward: int
    exercise_count: int
    status: LessonStatus
    legendary: bool  # a Legendary challenge on this lesson has been won


class SkillDetailOut(ApiModel):
    id: int
    unit_id: int
    course_id: int
    title: str
    icon: str
    description: str | None
    status: SkillStatus
    lessons_completed: int
    total_lessons: int
    progress: float
    next_lesson_id: int | None
    legendary: bool
    lessons: list[SkillLessonOut]


class GuidebookEntryOut(ApiModel):
    kind: GuidebookEntryKind
    text: str = Field(description="In the language being learned; this is what audio speaks.")
    translation: str


class GuidebookSectionOut(ApiModel):
    kind: GuidebookSectionKind
    title: str
    body: str | None
    term_heading: str | None = Field(description="Heading of the tip table's first column.")
    translation_heading: str | None = Field(description="Heading of the tip table's second column.")
    highlights: list[str] = Field(description="Words to accent in the tip's text; empty: default.")
    footer: str | None = Field(description="Closing paragraph, after the tip's table.")
    layout: Literal["default", "examples_first", "footer_last"] = Field(
        description="Order of a tip's parts: table/note/examples, examples/note/table or "
        "table/examples/note."
    )
    entries: list[GuidebookEntryOut]


class GuidebookOut(ApiModel):
    unit_id: int
    unit_position: int
    unit_title: str
    language: str = Field(description="BCP-47 code of the entries' language.", examples=["es"])
    introduction: str
    sections: list[GuidebookSectionOut]

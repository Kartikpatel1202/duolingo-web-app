from app.domain.enums import LessonStatus, SkillStatus
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


class PathUnitOut(ApiModel):
    id: int
    position: int
    title: str
    description: str | None
    theme: str
    skills: list[PathSkillOut]


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
    lessons: list[SkillLessonOut]

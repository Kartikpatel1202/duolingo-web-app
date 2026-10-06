"""Course catalogue, the learning path and the skill popover."""

from app.domain.enums import SkillStatus
from app.domain.errors import SkillNotFound
from app.models import Course, User
from app.repositories import ContentRepository
from app.schemas.course import (
    CourseDetailOut,
    CourseListOut,
    CourseOut,
    PathOut,
    PathSkillOut,
    PathUnitOut,
    SkillDetailOut,
    SkillLessonOut,
)
from app.services.context import ServiceContext
from app.services.course_progress import CourseProgress, CourseProgressService


def course_out(course: Course) -> CourseOut:
    return CourseOut(
        id=course.id,
        slug=course.slug,
        title=course.title,
        learning_language=course.learning_language,
        from_language=course.from_language,
        description=course.description,
    )


class CourseService:
    def __init__(self, ctx: ServiceContext) -> None:
        self._content = ContentRepository(ctx.session)
        self._course_progress = CourseProgressService(ctx)

    def list_courses(self) -> CourseListOut:
        return CourseListOut(courses=[course_out(c) for c in self._content.list_courses()])

    def course_detail(self, user: User, course_id: int) -> CourseDetailOut:
        progress = self._course_progress.load(user.id, course_id)
        lessons = [lesson for skill in progress.skills for lesson in skill.lessons]
        return CourseDetailOut(
            **course_out(progress.course).model_dump(),
            unit_count=len(progress.course.units),
            skill_count=len(progress.skills),
            lesson_count=len(lessons),
            completed_lesson_count=sum(
                1 for lesson in lessons if lesson.id in progress.completed_lessons
            ),
        )

    def path(self, user: User, course_id: int) -> PathOut:
        progress = self._course_progress.load(user.id, course_id)
        current = progress.current_skill()
        return PathOut(
            course=course_out(progress.course),
            current_skill_id=current.id if current else None,
            current_lesson_id=progress.next_lesson_id(current) if current else None,
            units=[
                PathUnitOut(
                    id=unit.id,
                    position=unit.position,
                    title=unit.title,
                    description=unit.description,
                    theme=unit.theme,
                    skills=[self._path_skill(progress, skill.id) for skill in unit.skills],
                )
                for unit in progress.course.units
            ],
        )

    def skill_detail(self, user: User, skill_id: int) -> SkillDetailOut:
        found = self._content.get_skill(skill_id)
        if found is None:
            raise SkillNotFound(skill_id=skill_id)
        progress = self._course_progress.load(user.id, found.unit.course_id)
        skill = progress.skill(skill_id)
        statuses = progress.lesson_statuses(skill)
        counts = self._content.exercise_counts([lesson.id for lesson in skill.lessons])
        summary = self._path_skill(progress, skill_id)
        return SkillDetailOut(
            **summary.model_dump(exclude={"position"}),
            unit_id=skill.unit_id,
            course_id=progress.course.id,
            lessons=[
                SkillLessonOut(
                    id=lesson.id,
                    position=lesson.position,
                    title=lesson.title,
                    xp_reward=lesson.xp_reward,
                    exercise_count=counts.get(lesson.id, 0),
                    status=statuses[lesson.id],
                )
                for lesson in skill.lessons
            ],
        )

    @staticmethod
    def _path_skill(progress: CourseProgress, skill_id: int) -> PathSkillOut:
        skill = progress.skill(skill_id)
        status = progress.skill_status(skill_id)
        return PathSkillOut(
            id=skill.id,
            position=skill.position,
            title=skill.title,
            icon=skill.icon,
            description=skill.description,
            status=status,
            lessons_completed=progress.lessons_completed(skill),
            total_lessons=len(skill.lessons),
            progress=progress.progress(skill),
            next_lesson_id=None if status is SkillStatus.LOCKED else progress.next_lesson_id(skill),
        )

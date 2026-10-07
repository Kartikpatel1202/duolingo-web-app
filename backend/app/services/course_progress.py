"""A learner's computed progress through one course (statuses are derived, never stored).

Loaded with three queries — content tree, completed lessons, completed skills — and evaluated by
the pure rules in `app.domain.unlocks`. Every place that needs a lock/unlock decision (path, skill
popover, lesson fetch, attempt start, completion) goes through this one read model.
"""

from app.domain import unlocks
from app.domain.enums import LessonStatus, SkillStatus
from app.domain.errors import CourseNotFound, LessonLocked, LessonNotFound
from app.models import Course, Lesson, Skill
from app.repositories import AttemptRepository, ContentRepository, ProgressRepository
from app.schemas.course import SkillProgressOut
from app.services.context import ServiceContext

_PLAYABLE = (SkillStatus.AVAILABLE, SkillStatus.IN_PROGRESS)


class CourseProgress:
    def __init__(
        self,
        course: Course,
        completed_lessons: set[int],
        completed_skills: set[int],
        legendary_lessons: set[int] | None = None,
    ) -> None:
        self.course = course
        self.completed_lessons = frozenset(completed_lessons)
        self.legendary_lessons = frozenset(legendary_lessons or ())
        self.skills: list[Skill] = [skill for unit in course.units for skill in unit.skills]
        self._skill_by_id = {skill.id: skill for skill in self.skills}
        outlines = [
            unlocks.SkillOutline(skill.id, tuple(lesson.id for lesson in skill.lessons))
            for skill in self.skills
        ]
        self._skill_status = unlocks.skill_statuses(
            outlines, set(completed_lessons), completed_skills
        )

    # --- skills ---------------------------------------------------------------------------------

    def skill(self, skill_id: int) -> Skill:
        return self._skill_by_id[skill_id]

    def is_skill_legendary(self, skill: Skill) -> bool:
        return bool(skill.lessons) and all(
            lesson.id in self.legendary_lessons for lesson in skill.lessons
        )

    def skill_status(self, skill_id: int) -> SkillStatus:
        return self._skill_status[skill_id]

    def lessons_completed(self, skill: Skill) -> int:
        return sum(1 for lesson in skill.lessons if lesson.id in self.completed_lessons)

    def progress(self, skill: Skill) -> float:
        total = len(skill.lessons)
        return 0.0 if total == 0 else round(self.lessons_completed(skill) / total, 4)

    def skill_progress_out(self, skill: Skill) -> SkillProgressOut:
        return SkillProgressOut(
            skill_id=skill.id,
            status=self.skill_status(skill.id),
            lessons_completed=self.lessons_completed(skill),
            total_lessons=len(skill.lessons),
            progress=self.progress(skill),
        )

    def next_skill_id(self, skill_id: int) -> int | None:
        index = self.skills.index(self.skill(skill_id))
        return self.skills[index + 1].id if index + 1 < len(self.skills) else None

    def current_skill(self) -> Skill | None:
        """The first skill the learner can still make progress in."""
        return next((s for s in self.skills if self.skill_status(s.id) in _PLAYABLE), None)

    # --- lessons --------------------------------------------------------------------------------

    def lesson_statuses(self, skill: Skill) -> dict[int, LessonStatus]:
        return unlocks.lesson_statuses(
            self.skill_status(skill.id),
            [lesson.id for lesson in skill.lessons],
            set(self.completed_lessons),
        )

    def lesson_status(self, lesson: Lesson) -> LessonStatus:
        return self.lesson_statuses(self.skill(lesson.skill_id))[lesson.id]

    def next_lesson_id(self, skill: Skill) -> int | None:
        """First available lesson of the skill; the first lesson (practice) if all are done;
        None if the skill is locked."""
        status = self.skill_status(skill.id)
        if status is SkillStatus.LOCKED or not skill.lessons:
            return None
        statuses = self.lesson_statuses(skill)
        upcoming = (lid for lid, st in statuses.items() if st is LessonStatus.AVAILABLE)
        return next(upcoming, skill.lessons[0].id)


class CourseProgressService:
    def __init__(self, ctx: ServiceContext) -> None:
        self._content = ContentRepository(ctx.session)
        self._progress = ProgressRepository(ctx.session)
        self._attempts = AttemptRepository(ctx.session)

    def load(self, user_id: int, course_id: int) -> CourseProgress:
        course = self._content.get_course_tree(course_id)
        if course is None:
            raise CourseNotFound(course_id=course_id)
        return CourseProgress(
            course,
            self._progress.completed_lesson_ids(user_id),
            self._progress.completed_skill_ids(user_id),
            self._attempts.legendary_lesson_ids(user_id),
        )

    def require_unlocked_lesson(
        self, user_id: int, lesson_id: int
    ) -> tuple[Lesson, CourseProgress]:
        """The lesson (with exercises) and course progress; raises if missing or locked.
        This is the server-side lock enforcement — the client is never trusted with it."""
        lesson = self._content.get_lesson(lesson_id)
        if lesson is None:
            raise LessonNotFound(lesson_id=lesson_id)
        progress = self.load(user_id, lesson.skill.unit.course_id)
        if progress.lesson_status(lesson) is LessonStatus.LOCKED:
            raise LessonLocked(lesson_id=lesson_id)
        return lesson, progress

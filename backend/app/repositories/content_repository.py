"""Read access to course content (the content tree is read-only at runtime)."""

from collections.abc import Sequence

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models import Course, Exercise, Guidebook, GuidebookSection, Lesson, Skill, Unit


class ContentRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def list_courses(self) -> Sequence[Course]:
        return self._session.scalars(select(Course).order_by(Course.id)).all()

    def get_course(self, course_id: int) -> Course | None:
        return self._session.get(Course, course_id)

    def get_course_tree(self, course_id: int) -> Course | None:
        """Course with units → skills → lessons eagerly loaded (3 extra queries, no N+1)."""
        statement = (
            select(Course)
            .where(Course.id == course_id)
            .options(
                selectinload(Course.units).selectinload(Unit.skills).selectinload(Skill.lessons)
            )
        )
        return self._session.scalars(statement).one_or_none()

    def get_unit_with_guidebook(self, unit_id: int) -> Unit | None:
        """Unit with its course and the whole guidebook tree (no N+1)."""
        statement = (
            select(Unit)
            .where(Unit.id == unit_id)
            .options(
                selectinload(Unit.course),
                selectinload(Unit.guidebook)
                .selectinload(Guidebook.sections)
                .selectinload(GuidebookSection.entries),
            )
        )
        return self._session.scalars(statement).one_or_none()

    def get_skill(self, skill_id: int) -> Skill | None:
        statement = select(Skill).where(Skill.id == skill_id).options(selectinload(Skill.unit))
        return self._session.scalars(statement).one_or_none()

    def get_lesson(self, lesson_id: int) -> Lesson | None:
        """Lesson with its exercises and its skill/unit (to find the course)."""
        statement = (
            select(Lesson)
            .where(Lesson.id == lesson_id)
            .options(
                selectinload(Lesson.exercises),
                selectinload(Lesson.skill).selectinload(Skill.unit),
            )
        )
        return self._session.scalars(statement).one_or_none()

    def exercise_counts(self, lesson_ids: Sequence[int]) -> dict[int, int]:
        statement = (
            select(Exercise.lesson_id, func.count(Exercise.id))
            .where(Exercise.lesson_id.in_(lesson_ids))
            .group_by(Exercise.lesson_id)
        )
        return {lesson_id: count for lesson_id, count in self._session.execute(statement)}

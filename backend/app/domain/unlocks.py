"""Unlock rules for skills and lessons, computed from persisted facts (never stored).

* Skills form a linear path in global order (unit position, skill position).
* The first skill is always unlocked; any other skill unlocks when the previous one is completed.
* "Jump here": the first skill of every unit is also always unlocked, so a learner can start any
  unit without finishing the ones before it. The rest of that unit still unlocks skill by skill.
* Inside an unlocked skill, lesson 1 is available and each later lesson unlocks when the previous
  lesson is completed. Completed lessons stay replayable.
"""

from collections.abc import Sequence
from dataclasses import dataclass

from app.domain.enums import LessonStatus, SkillStatus


@dataclass(frozen=True)
class SkillOutline:
    skill_id: int
    lesson_ids: tuple[int, ...]  # in lesson position order
    starts_unit: bool = False  # first skill of its unit: always unlocked ("Jump here")


def skill_statuses(
    skills: Sequence[SkillOutline],
    completed_lessons: set[int],
    completed_skills: set[int],
) -> dict[int, SkillStatus]:
    statuses: dict[int, SkillStatus] = {}
    previous_completed = True  # the first skill has no prerequisite
    for skill in skills:
        if skill.skill_id in completed_skills:
            status = SkillStatus.COMPLETED
        elif not previous_completed and not skill.starts_unit:
            status = SkillStatus.LOCKED
        elif any(lesson_id in completed_lessons for lesson_id in skill.lesson_ids):
            status = SkillStatus.IN_PROGRESS
        else:
            status = SkillStatus.AVAILABLE
        statuses[skill.skill_id] = status
        previous_completed = status is SkillStatus.COMPLETED
    return statuses


def lesson_statuses(
    skill_status: SkillStatus,
    lesson_ids: Sequence[int],
    completed_lessons: set[int],
) -> dict[int, LessonStatus]:
    statuses: dict[int, LessonStatus] = {}
    previous_completed = skill_status is not SkillStatus.LOCKED
    for lesson_id in lesson_ids:
        if lesson_id in completed_lessons:
            status = LessonStatus.COMPLETED
        elif previous_completed:
            status = LessonStatus.AVAILABLE
        else:
            status = LessonStatus.LOCKED
        statuses[lesson_id] = status
        previous_completed = status is LessonStatus.COMPLETED
    return statuses


def all_lessons_completed(lesson_ids: Sequence[int], completed_lessons: set[int]) -> bool:
    return all(lesson_id in completed_lessons for lesson_id in lesson_ids)

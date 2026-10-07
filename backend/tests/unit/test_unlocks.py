from app.domain.enums import LessonStatus, SkillStatus
from app.domain.unlocks import SkillOutline, all_lessons_completed, lesson_statuses, skill_statuses

# Three skills in global path order; lesson ids are unique across the course.
PATH = [SkillOutline(1, (10, 11)), SkillOutline(2, (20, 21)), SkillOutline(3, (30, 31))]


def test_fresh_learner_has_only_the_first_skill_available() -> None:
    assert skill_statuses(PATH, set(), set()) == {
        1: SkillStatus.AVAILABLE,
        2: SkillStatus.LOCKED,
        3: SkillStatus.LOCKED,
    }


def test_partially_completed_skill_is_in_progress_and_does_not_unlock_the_next() -> None:
    statuses = skill_statuses(PATH, {10}, set())
    assert statuses[1] is SkillStatus.IN_PROGRESS
    assert statuses[2] is SkillStatus.LOCKED


def test_completing_a_skill_unlocks_only_the_next_one() -> None:
    assert skill_statuses(PATH, {10, 11}, {1}) == {
        1: SkillStatus.COMPLETED,
        2: SkillStatus.AVAILABLE,
        3: SkillStatus.LOCKED,
    }


def test_skill_completion_milestone_wins_even_if_content_grows() -> None:
    # Skill 1 was completed before lesson 12 was added: it stays completed and 2 stays unlocked.
    path = [SkillOutline(1, (10, 11, 12)), SkillOutline(2, (20,))]
    assert skill_statuses(path, {10, 11}, {1})[2] is SkillStatus.AVAILABLE


def test_lessons_unlock_in_order_inside_a_skill() -> None:
    assert lesson_statuses(SkillStatus.AVAILABLE, [10, 11, 12], set()) == {
        10: LessonStatus.AVAILABLE,
        11: LessonStatus.LOCKED,
        12: LessonStatus.LOCKED,
    }
    assert lesson_statuses(SkillStatus.IN_PROGRESS, [10, 11, 12], {10}) == {
        10: LessonStatus.COMPLETED,
        11: LessonStatus.AVAILABLE,
        12: LessonStatus.LOCKED,
    }


def test_locked_skill_has_only_locked_lessons() -> None:
    assert set(lesson_statuses(SkillStatus.LOCKED, [20, 21], set()).values()) == {
        LessonStatus.LOCKED
    }


def test_completed_lessons_stay_completed_for_replay() -> None:
    statuses = lesson_statuses(SkillStatus.COMPLETED, [10, 11], {10, 11})
    assert set(statuses.values()) == {LessonStatus.COMPLETED}


def test_all_lessons_completed() -> None:
    assert all_lessons_completed([10, 11], {10, 11, 20})
    assert not all_lessons_completed([10, 11], {10})


def test_the_first_skill_of_a_unit_is_open_without_finishing_the_previous_unit() -> None:
    # Two units of two skills each; nothing played. "Jump here" opens skill 3, not skill 4.
    path = [
        SkillOutline(1, (10,), starts_unit=True),
        SkillOutline(2, (20,)),
        SkillOutline(3, (30,), starts_unit=True),
        SkillOutline(4, (40,)),
    ]
    assert skill_statuses(path, set(), set()) == {
        1: SkillStatus.AVAILABLE,
        2: SkillStatus.LOCKED,
        3: SkillStatus.AVAILABLE,
        4: SkillStatus.LOCKED,
    }
    # Playing the jumped-to skill unlocks the next skill of that unit only.
    assert skill_statuses(path, {30}, {3}) == {
        1: SkillStatus.AVAILABLE,
        2: SkillStatus.LOCKED,
        3: SkillStatus.COMPLETED,
        4: SkillStatus.AVAILABLE,
    }

"""Enumerations shared by the domain, persistence and API layers."""

from enum import StrEnum


class ExerciseType(StrEnum):
    MULTIPLE_CHOICE = "multiple_choice"
    WORD_BANK = "word_bank"
    MATCH_PAIRS = "match_pairs"
    FILL_BLANK = "fill_blank"
    TYPE_ANSWER = "type_answer"


class AttemptStatus(StrEnum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class XpSource(StrEnum):
    LESSON_COMPLETION = "lesson_completion"
    PERFECT_BONUS = "perfect_bonus"
    SEED = "seed"


class AchievementMetric(StrEnum):
    LESSONS_COMPLETED = "lessons_completed"
    TOTAL_XP = "total_xp"
    LONGEST_STREAK = "longest_streak"
    SKILLS_COMPLETED = "skills_completed"
    PERFECT_LESSONS = "perfect_lessons"


class SkillStatus(StrEnum):
    LOCKED = "locked"
    AVAILABLE = "available"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class LessonStatus(StrEnum):
    LOCKED = "locked"
    AVAILABLE = "available"
    COMPLETED = "completed"

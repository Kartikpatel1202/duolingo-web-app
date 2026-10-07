"""Seeded learners and the achievement catalog."""

from dataclasses import dataclass

from app.domain.enums import AchievementMetric


@dataclass(frozen=True)
class RivalSpec:
    username: str
    display_name: str
    avatar_color: str
    weekly_pace: tuple[int, int, int, int, int, int, int]  # XP earned Monday … Sunday


LEARNER_DISPLAY_NAME = "Alex"
# Demo sign-in for the seeded learner (documented in the README; change them for real use).
LEARNER_EMAIL = "alex@example.com"
LEARNER_PASSWORD = "learn-spanish"
# A fixed salt keeps the seed deterministic; real accounts would get a random salt each.
LEARNER_PASSWORD_SALT = b"lingo-demo-seed-salt"
LEARNER_AVATAR_COLOR = "sky"

RIVALS: tuple[RivalSpec, ...] = (
    RivalSpec("maria", "María", "cherry", (40, 35, 50, 30, 45, 25, 60)),
    RivalSpec("kenji", "Kenji", "grape", (20, 30, 25, 40, 20, 35, 30)),
    RivalSpec("amara", "Amara", "ember", (30, 25, 30, 25, 30, 25, 30)),
    RivalSpec("lucas", "Lucas", "leaf", (15, 5, 20, 30, 10, 25, 15)),
    RivalSpec("noah", "Noah", "sun", (50, 20, 5, 10, 40, 30, 20)),
    RivalSpec("chloe", "Chloé", "sky", (25, 10, 20, 15, 5, 30, 20)),
    RivalSpec("sofia", "Sofía", "cherry", (10, 20, 5, 15, 20, 10, 25)),
    RivalSpec("priya", "Priya", "grape", (5, 15, 10, 20, 15, 10, 5)),
    RivalSpec("liam", "Liam", "leaf", (5, 10, 15, 5, 20, 10, 10)),
)


@dataclass(frozen=True)
class AchievementSpec:
    code: str
    title: str
    description: str
    icon: str
    metric: AchievementMetric
    threshold: int


ACHIEVEMENTS: tuple[AchievementSpec, ...] = (
    AchievementSpec(
        "first_lesson",
        "First Steps",
        "Complete your first lesson.",
        "footprints",
        AchievementMetric.LESSONS_COMPLETED,
        1,
    ),
    AchievementSpec(
        "lessons_10",
        "Bookworm",
        "Complete 10 lessons.",
        "book",
        AchievementMetric.LESSONS_COMPLETED,
        10,
    ),
    AchievementSpec("xp_100", "Century", "Earn 100 XP.", "bolt", AchievementMetric.TOTAL_XP, 100),
    AchievementSpec("xp_500", "Scholar", "Earn 500 XP.", "trophy", AchievementMetric.TOTAL_XP, 500),
    AchievementSpec(
        "streak_3", "On Fire", "Reach a 3-day streak.", "flame", AchievementMetric.LONGEST_STREAK, 3
    ),
    AchievementSpec(
        "streak_7",
        "Week Warrior",
        "Reach a 7-day streak.",
        "calendar",
        AchievementMetric.LONGEST_STREAK,
        7,
    ),
    AchievementSpec(
        "perfect_1",
        "Flawless",
        "Finish a lesson without mistakes.",
        "star",
        AchievementMetric.PERFECT_LESSONS,
        1,
    ),
    AchievementSpec(
        "skill_1",
        "Skill Master",
        "Complete your first skill.",
        "crown",
        AchievementMetric.SKILLS_COMPLETED,
        1,
    ),
    AchievementSpec(
        "skills_3",
        "Unit Champion",
        "Complete three skills.",
        "medal",
        AchievementMetric.SKILLS_COMPLETED,
        3,
    ),
)

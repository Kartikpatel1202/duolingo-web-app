from datetime import UTC, date, datetime

import pytest

from app.domain.achievements import AchievementRule, newly_earned
from app.domain.enums import AchievementMetric, XpSource
from app.domain.leaderboard import Standing, next_week_start, rank_standings, week_start
from app.domain.xp import XpAward, accuracy, completion_awards

# --- XP ----------------------------------------------------------------------------------------


def test_first_perfect_completion_earns_lesson_xp_plus_bonus() -> None:
    assert completion_awards(first_completion=True, lesson_xp=10, mistakes=0) == [
        XpAward(XpSource.LESSON_COMPLETION, 10),
        XpAward(XpSource.PERFECT_BONUS, 5),
    ]


def test_first_completion_with_mistakes_earns_no_bonus() -> None:
    assert completion_awards(first_completion=True, lesson_xp=10, mistakes=2) == [
        XpAward(XpSource.LESSON_COMPLETION, 10)
    ]


def test_replay_earns_no_completion_xp() -> None:
    assert completion_awards(first_completion=False, lesson_xp=10, mistakes=0) == []


def test_accuracy() -> None:
    assert accuracy(exercises=7, mistakes=0) == 1.0
    assert accuracy(exercises=7, mistakes=1) == 0.875


# --- leaderboard weeks ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("day", "monday"),
    [
        (date(2026, 10, 5), date(2026, 10, 5)),  # Monday
        (date(2026, 10, 7), date(2026, 10, 5)),  # Wednesday
        (date(2026, 10, 11), date(2026, 10, 5)),  # Sunday
        (date(2026, 10, 12), date(2026, 10, 12)),  # next Monday
        (date(2027, 1, 1), date(2026, 12, 28)),  # across a year boundary
    ],
)
def test_week_starts_on_monday(day: date, monday: date) -> None:
    assert week_start(day) == monday


def test_next_week_start() -> None:
    assert next_week_start(date(2026, 10, 11)) == date(2026, 10, 12)


def test_ranking_is_deterministic_with_ties() -> None:
    early = datetime(2026, 10, 6, 9, tzinfo=UTC)
    late = datetime(2026, 10, 6, 18, tzinfo=UTC)
    ranked = rank_standings(
        [
            Standing(user_id=4, xp=0, reached_at=None),
            Standing(user_id=3, xp=50, reached_at=late),
            Standing(user_id=2, xp=50, reached_at=early),  # reached 50 first → ahead
            Standing(user_id=5, xp=0, reached_at=None),
            Standing(user_id=1, xp=80, reached_at=late),
        ]
    )
    assert [(r.rank, r.standing.user_id) for r in ranked] == [
        (1, 1),
        (2, 2),
        (3, 3),
        (4, 4),
        (5, 5),
    ]


# --- achievements --------------------------------------------------------------------------------

RULES = [
    AchievementRule(1, AchievementMetric.LESSONS_COMPLETED, 1),
    AchievementRule(2, AchievementMetric.TOTAL_XP, 100),
    AchievementRule(3, AchievementMetric.LONGEST_STREAK, 3),
]


def test_achievements_earned_when_threshold_reached() -> None:
    metrics = {
        AchievementMetric.LESSONS_COMPLETED: 1,
        AchievementMetric.TOTAL_XP: 100,
        AchievementMetric.LONGEST_STREAK: 2,
    }
    assert newly_earned(RULES, metrics, set()) == [1, 2]


def test_already_earned_achievements_are_not_awarded_again() -> None:
    metrics = {AchievementMetric.LESSONS_COMPLETED: 5, AchievementMetric.TOTAL_XP: 500}
    assert newly_earned(RULES, metrics, {1}) == [2]

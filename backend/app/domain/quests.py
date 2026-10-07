"""Daily quests: goals derived from today's facts (lessons, XP, perfect lessons).

Progress is never stored — it is computed from the XP ledger and completed attempts for the
current learning day. Only the *claim* of a reward is stored (as a reward claim fact), which makes
claiming idempotent and resets quests automatically at local midnight.
"""

from collections.abc import Mapping
from dataclasses import dataclass
from enum import StrEnum


class QuestMetric(StrEnum):
    LESSONS_TODAY = "lessons_today"
    XP_TODAY = "xp_today"
    PERFECT_LESSONS_TODAY = "perfect_lessons_today"


@dataclass(frozen=True)
class Quest:
    code: str
    title: str
    metric: QuestMetric
    target: int
    reward_gems: int


DAILY_QUESTS: tuple[Quest, ...] = (
    Quest("daily_lesson", "Complete your next lesson", QuestMetric.LESSONS_TODAY, 1, 10),
    Quest("daily_xp", "Earn 30 XP", QuestMetric.XP_TODAY, 30, 10),
    Quest(
        "daily_perfect",
        "Finish a lesson with no mistakes",
        QuestMetric.PERFECT_LESSONS_TODAY,
        1,
        15,
    ),
)


def quest_by_code(code: str) -> Quest | None:
    return next((quest for quest in DAILY_QUESTS if quest.code == code), None)


def progress(quest: Quest, metrics: Mapping[QuestMetric, int]) -> int:
    return min(metrics.get(quest.metric, 0), quest.target)


def is_complete(quest: Quest, metrics: Mapping[QuestMetric, int]) -> bool:
    return progress(quest, metrics) >= quest.target

"""Achievement rules: an achievement is earned once the learner's metric reaches its threshold."""

from collections.abc import Iterable, Mapping
from dataclasses import dataclass

from app.domain.enums import AchievementMetric


@dataclass(frozen=True)
class AchievementRule:
    achievement_id: int
    metric: AchievementMetric
    threshold: int


def newly_earned(
    rules: Iterable[AchievementRule],
    metrics: Mapping[AchievementMetric, int],
    already_earned: set[int],
) -> list[int]:
    """Ids of achievements whose threshold is met and that the learner does not have yet.
    Earned achievements are never revoked, even if a metric later decreases."""
    return [
        rule.achievement_id
        for rule in rules
        if rule.achievement_id not in already_earned
        and metrics.get(rule.metric, 0) >= rule.threshold
    ]

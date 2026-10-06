"""Achievements: metrics come from persisted facts; earned rows are never removed."""

from collections.abc import Sequence

from app.domain.achievements import AchievementRule, newly_earned
from app.domain.enums import AchievementMetric
from app.models import Achievement, User, UserAchievement
from app.repositories import AchievementRepository, ProgressRepository, XpRepository
from app.schemas.gamification import ProfileAchievementOut
from app.services.context import ServiceContext


class AchievementService:
    def __init__(self, ctx: ServiceContext) -> None:
        self._ctx = ctx
        self._achievements = AchievementRepository(ctx.session)
        self._progress = ProgressRepository(ctx.session)
        self._xp = XpRepository(ctx.session)

    def metrics(self, user: User) -> dict[AchievementMetric, int]:
        return {
            AchievementMetric.LESSONS_COMPLETED: len(self._progress.completed_lesson_ids(user.id)),
            AchievementMetric.TOTAL_XP: self._xp.total_xp(user.id),
            AchievementMetric.LONGEST_STREAK: user.longest_streak,
            AchievementMetric.SKILLS_COMPLETED: len(self._progress.completed_skill_ids(user.id)),
            AchievementMetric.PERFECT_LESSONS: self._progress.perfect_lesson_count(user.id),
        }

    def award_new(self, user: User, attempt_id: str) -> list[Achievement]:
        """Grant every achievement whose threshold is now met (does not commit)."""
        catalog = {achievement.id: achievement for achievement in self._achievements.catalog()}
        rules = [AchievementRule(a.id, a.metric, a.threshold) for a in catalog.values()]
        earned_ids = newly_earned(
            rules, self.metrics(user), set(self._achievements.earned(user.id))
        )
        now = self._ctx.now()
        for achievement_id in earned_ids:
            self._ctx.session.add(
                UserAchievement(
                    user_id=user.id,
                    achievement_id=achievement_id,
                    lesson_attempt_id=attempt_id,
                    earned_at=now,
                )
            )
        return [catalog[achievement_id] for achievement_id in earned_ids]

    def earned_by_attempt(self, attempt_id: str) -> Sequence[Achievement]:
        return self._achievements.earned_by_attempt(attempt_id)

    def overview(self, user: User) -> list[ProfileAchievementOut]:
        metrics = self.metrics(user)
        earned = self._achievements.earned(user.id)
        return [
            ProfileAchievementOut(
                code=achievement.code,
                title=achievement.title,
                description=achievement.description,
                icon=achievement.icon,
                metric=achievement.metric,
                threshold=achievement.threshold,
                progress=min(metrics[achievement.metric], achievement.threshold),
                earned_at=earned[achievement.id].earned_at if achievement.id in earned else None,
            )
            for achievement in self._achievements.catalog()
        ]

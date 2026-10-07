"""Activity feed composed from real data (league, achievements, streak) plus daily tips.

Nothing here is random: the same database state and day always produce the same feed.
"""

from app.domain.feed import tips_for
from app.domain.leaderboard import week_start
from app.models import User
from app.repositories import AchievementRepository, XpRepository
from app.schemas.engagement import FeedItemOut, FeedOut
from app.services.context import ServiceContext
from app.services.stats_service import StatsService

RIVAL_HIGHLIGHTS = 3
TIP_COUNT = 3
STREAK_HIGHLIGHT_DAYS = 2


class FeedService:
    def __init__(self, ctx: ServiceContext) -> None:
        self._ctx = ctx
        self._xp = XpRepository(ctx.session)
        self._achievements = AchievementRepository(ctx.session)
        self._stats = StatsService(ctx)

    def feed(self, user: User) -> FeedOut:
        tips = [
            FeedItemOut(
                id=f"tip:{tip.code}",
                kind="tip",
                label=tip.label,
                title=tip.title,
                body=tip.body,
                actor_name=None,
                actor_color=None,
                occurred_at=None,
            )
            for tip in tips_for(self._ctx.today(), TIP_COUNT)
        ]
        league = self._league(user)
        items = [*self._streak(user), *league[:2], *tips[:1], *self._achievements_of(user)]
        return FeedOut(items=[*items, *league[2:], *tips[1:]])

    def _streak(self, user: User) -> list[FeedItemOut]:
        streak = self._stats.streak(user)
        if streak.current < STREAK_HIGHLIGHT_DAYS:
            return []
        return [
            FeedItemOut(
                id=f"streak:{user.id}:{streak.current}",
                kind="streak",
                label="STREAK",
                title=f"You're on a {streak.current}-day streak!",
                body="Practice today to keep the flame alive.",
                actor_name=user.display_name,
                actor_color=user.avatar_color,
                occurred_at=None,
            )
        ]

    def _league(self, user: User) -> list[FeedItemOut]:
        week = week_start(self._ctx.today())
        rivals = [
            (member, entry)
            for member, entry in self._xp.weekly_standings(week)
            if entry is not None and entry.xp > 0 and member.id != user.id
        ]
        rivals.sort(key=lambda pair: (-pair[1].xp, pair[0].id))
        return [
            FeedItemOut(
                id=f"league:{member.id}:{week.isoformat()}",
                kind="league",
                label="LEAGUE",
                title=f"{member.display_name} earned {entry.xp} XP this week",
                body="Keep practising to climb the weekly league.",
                actor_name=member.display_name,
                actor_color=member.avatar_color,
                occurred_at=entry.updated_at,
            )
            for member, entry in rivals[:RIVAL_HIGHLIGHTS]
        ]

    def _achievements_of(self, user: User) -> list[FeedItemOut]:
        earned = self._achievements.earned(user.id)
        catalog = {a.id: a for a in self._achievements.catalog()}
        recent = sorted(earned.values(), key=lambda row: row.earned_at, reverse=True)
        return [
            FeedItemOut(
                id=f"achievement:{row.id}",
                kind="achievement",
                label="ACHIEVEMENT",
                title=f"You unlocked {catalog[row.achievement_id].title}",
                body=catalog[row.achievement_id].description,
                actor_name=user.display_name,
                actor_color=user.avatar_color,
                occurred_at=row.earned_at,
            )
            for row in recent
        ]

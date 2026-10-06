from app.models import User
from app.repositories import ProgressRepository
from app.schemas.gamification import ProfileOut, ProfileStatsOut, ProfileUserOut
from app.services.achievement_service import AchievementService
from app.services.context import ServiceContext
from app.services.leaderboard_service import LeaderboardService
from app.services.stats_service import StatsService


class ProfileService:
    def __init__(self, ctx: ServiceContext) -> None:
        self._progress = ProgressRepository(ctx.session)
        self._stats = StatsService(ctx)
        self._leaderboard = LeaderboardService(ctx)
        self._achievements = AchievementService(ctx)

    def profile(self, user: User) -> ProfileOut:
        standing = self._leaderboard.standing(user)
        streak = self._stats.streak(user)
        return ProfileOut(
            user=ProfileUserOut(
                id=user.id,
                username=user.username,
                display_name=user.display_name,
                avatar_color=user.avatar_color,
                joined_at=user.created_at,
            ),
            stats=ProfileStatsOut(
                total_xp=self._stats.total_xp(user),
                current_streak=streak.current,
                longest_streak=streak.longest,
                lessons_completed=len(self._progress.completed_lesson_ids(user.id)),
                skills_completed=len(self._progress.completed_skill_ids(user.id)),
                weekly_xp=standing.xp,
                league_rank=standing.rank,
            ),
            achievements=self._achievements.overview(user),
        )

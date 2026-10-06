"""Weekly leaderboard (Monday 00:00 → Monday 00:00 in APP_TIMEZONE)."""

from dataclasses import dataclass

from app.core.clock import local_midnight_utc
from app.domain.leaderboard import (
    RankedStanding,
    Standing,
    next_week_start,
    rank_standings,
    week_start,
)
from app.models import User
from app.repositories import XpRepository
from app.schemas.gamification import LeaderboardOut, LeaderboardRowOut, LeaderboardStandingOut
from app.services.context import ServiceContext


@dataclass(frozen=True)
class _WeeklyBoard:
    ranked: list[RankedStanding]
    users: dict[int, User]

    def standing_of(self, user_id: int) -> RankedStanding:
        return next(r for r in self.ranked if r.standing.user_id == user_id)


class LeaderboardService:
    def __init__(self, ctx: ServiceContext) -> None:
        self._ctx = ctx
        self._xp = XpRepository(ctx.session)

    def weekly(self, user: User, limit: int) -> LeaderboardOut:
        today = self._ctx.today()
        board = self._board()
        me = board.standing_of(user.id)
        return LeaderboardOut(
            week_start=week_start(today),
            resets_at=local_midnight_utc(next_week_start(today), self._ctx.timezone),
            entries=[self._row(board, ranked, user.id) for ranked in board.ranked[:limit]],
            current_user=LeaderboardStandingOut(rank=me.rank, xp=me.standing.xp),
        )

    def standing(self, user: User) -> LeaderboardStandingOut:
        me = self._board().standing_of(user.id)
        return LeaderboardStandingOut(rank=me.rank, xp=me.standing.xp)

    def _board(self) -> _WeeklyBoard:
        rows = self._xp.weekly_standings(week_start(self._ctx.today()))
        standings = [
            Standing(member.id, entry.xp if entry else 0, entry.updated_at if entry else None)
            for member, entry in rows
        ]
        return _WeeklyBoard(rank_standings(standings), {member.id: member for member, _ in rows})

    @staticmethod
    def _row(
        board: _WeeklyBoard, ranked: RankedStanding, current_user_id: int
    ) -> LeaderboardRowOut:
        member = board.users[ranked.standing.user_id]
        return LeaderboardRowOut(
            rank=ranked.rank,
            user_id=member.id,
            display_name=member.display_name,
            avatar_color=member.avatar_color,
            xp=ranked.standing.xp,
            is_current_user=member.id == current_user_id,
        )

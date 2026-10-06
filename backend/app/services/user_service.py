from app.domain.errors import UserNotFound
from app.models import User
from app.repositories import UserRepository
from app.schemas.user import CurrentUserOut, UpdateUserIn
from app.services.context import ServiceContext
from app.services.hearts_service import HeartsService
from app.services.stats_service import StatsService


class UserService:
    def __init__(self, ctx: ServiceContext) -> None:
        self._ctx = ctx
        self._users = UserRepository(ctx.session)
        self._stats = StatsService(ctx)
        self._hearts = HeartsService(ctx)

    def get_by_username(self, username: str) -> User:
        user = self._users.get_by_username(username)
        if user is None:
            raise UserNotFound(username=username)
        return user

    def me(self, user: User) -> CurrentUserOut:
        return CurrentUserOut(
            id=user.id,
            username=user.username,
            display_name=user.display_name,
            avatar_color=user.avatar_color,
            current_course_id=user.current_course_id,
            total_xp=self._stats.total_xp(user),
            gems=user.gems,
            hearts=self._hearts.view(user),
            streak=self._stats.streak(user),
            daily=self._stats.daily(user),
        )

    def update(self, user: User, changes: UpdateUserIn) -> CurrentUserOut:
        user.daily_goal_xp = changes.daily_goal_xp
        self._ctx.session.commit()
        return self.me(user)

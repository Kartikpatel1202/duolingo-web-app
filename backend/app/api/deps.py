"""FastAPI dependencies: session, clock, current learner and service factories.

The engine, session factory and clock live on `app.state` (set by `create_app`), so tests build an
app with an in-memory database and a FixedClock without monkeypatching.
"""

from collections.abc import Callable, Iterator
from typing import Annotated, TypeVar

from fastapi import Depends, Header, Request
from sqlalchemy.orm import Session

from app.core.clock import Clock
from app.core.config import Settings
from app.db.database import session_scope
from app.models import User
from app.services.answer_service import AnswerService
from app.services.auth_service import AuthService
from app.services.completion_service import CompletionService
from app.services.context import ServiceContext
from app.services.course_service import CourseService
from app.services.feed_service import FeedService
from app.services.guidebook_service import GuidebookService
from app.services.hearts_service import HeartsService
from app.services.leaderboard_service import LeaderboardService
from app.services.lesson_service import LessonService
from app.services.profile_service import ProfileService
from app.services.progress_service import ProgressService
from app.services.quest_service import QuestService
from app.services.reward_service import RewardService
from app.services.shop_service import ShopService
from app.services.streak_service import StreakService
from app.services.user_service import UserService


def get_settings(request: Request) -> Settings:
    settings: Settings = request.app.state.settings
    return settings


def get_clock(request: Request) -> Clock:
    clock: Clock = request.app.state.clock
    return clock


def get_session(request: Request) -> Iterator[Session]:
    yield from session_scope(request.app.state.session_factory)


SettingsDep = Annotated[Settings, Depends(get_settings)]
ClockDep = Annotated[Clock, Depends(get_clock)]


def get_context(
    session: Annotated[Session, Depends(get_session)],
    clock: ClockDep,
    settings: SettingsDep,
) -> ServiceContext:
    return ServiceContext(session=session, clock=clock, timezone=settings.timezone)


ContextDep = Annotated[ServiceContext, Depends(get_context)]


def get_auth_service(ctx: ContextDep, settings: SettingsDep) -> AuthService:
    return AuthService(ctx, settings)


AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]


def get_current_user(
    service: AuthServiceDep, authorization: Annotated[str | None, Header()] = None
) -> User:
    """The signed-in learner, from `Authorization: Bearer <token>`; 401 when it is missing or
    invalid. Every route that needs a learner depends on this one function."""
    scheme, _, token = (authorization or "").partition(" ")
    return service.user_for_token(token.strip() if scheme.lower() == "bearer" else None)


CurrentUser = Annotated[User, Depends(get_current_user)]

S = TypeVar("S")


def _service(factory: Callable[[ServiceContext], S]) -> Callable[[ServiceContext], S]:
    def provide(ctx: ContextDep) -> S:
        return factory(ctx)

    return provide


UserServiceDep = Annotated[UserService, Depends(_service(UserService))]
CourseServiceDep = Annotated[CourseService, Depends(_service(CourseService))]
LessonServiceDep = Annotated[LessonService, Depends(_service(LessonService))]
AnswerServiceDep = Annotated[AnswerService, Depends(_service(AnswerService))]
CompletionServiceDep = Annotated[CompletionService, Depends(_service(CompletionService))]
ProgressServiceDep = Annotated[ProgressService, Depends(_service(ProgressService))]
HeartsServiceDep = Annotated[HeartsService, Depends(_service(HeartsService))]
LeaderboardServiceDep = Annotated[LeaderboardService, Depends(_service(LeaderboardService))]
ProfileServiceDep = Annotated[ProfileService, Depends(_service(ProfileService))]
StreakServiceDep = Annotated[StreakService, Depends(_service(StreakService))]
ShopServiceDep = Annotated[ShopService, Depends(_service(ShopService))]
QuestServiceDep = Annotated[QuestService, Depends(_service(QuestService))]
RewardServiceDep = Annotated[RewardService, Depends(_service(RewardService))]
FeedServiceDep = Annotated[FeedService, Depends(_service(FeedService))]
GuidebookServiceDep = Annotated[GuidebookService, Depends(_service(GuidebookService))]

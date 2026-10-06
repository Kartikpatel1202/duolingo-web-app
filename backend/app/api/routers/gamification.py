"""Hearts, leaderboard and profile."""

from typing import Annotated

from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, HeartsServiceDep, LeaderboardServiceDep, ProfileServiceDep
from app.api.responses import errors
from app.schemas.common import HeartsOut
from app.schemas.gamification import LeaderboardOut, ProfileOut, RefillOut

router = APIRouter()


@router.get("/hearts", summary="Hearts with regeneration info", tags=["hearts"])
def get_hearts(user: CurrentUser, service: HeartsServiceDep) -> HeartsOut:
    return service.view(user)


@router.post(
    "/hearts/refill",
    summary="Refill hearts with gems",
    tags=["hearts"],
    responses=errors(409),
)
def refill_hearts(user: CurrentUser, service: HeartsServiceDep) -> RefillOut:
    return service.refill(user)


@router.get("/leaderboard", summary="This week's leaderboard", tags=["leaderboard"])
def get_leaderboard(
    user: CurrentUser,
    service: LeaderboardServiceDep,
    limit: Annotated[int, Query(ge=1, le=100)] = 30,
) -> LeaderboardOut:
    return service.weekly(user, limit)


@router.get("/profile", summary="Profile, stats and achievements", tags=["profile"])
def get_profile(user: CurrentUser, service: ProfileServiceDep) -> ProfileOut:
    return service.profile(user)

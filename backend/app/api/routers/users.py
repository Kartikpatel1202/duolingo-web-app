from fastapi import APIRouter

from app.api.deps import CurrentUser, UserServiceDep
from app.api.responses import errors
from app.schemas.user import CurrentUserOut, UpdateUserIn

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", summary="Current learner with top-bar stats", responses=errors(404))
def get_me(user: CurrentUser, service: UserServiceDep) -> CurrentUserOut:
    return service.me(user)


@router.patch("/me", summary="Update learner preferences (daily goal)", responses=errors(404))
def update_me(body: UpdateUserIn, user: CurrentUser, service: UserServiceDep) -> CurrentUserOut:
    return service.update(user, body)

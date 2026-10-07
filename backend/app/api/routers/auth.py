from fastapi import APIRouter, Response, status

from app.api.deps import AuthServiceDep, CurrentUser
from app.api.responses import errors
from app.schemas.auth import LoginIn, SessionOut, SignupIn

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/login", summary="Sign in with email (or username) and password", responses=errors(401)
)
def login(body: LoginIn, service: AuthServiceDep) -> SessionOut:
    return service.login(body.identifier, body.password)


@router.post(
    "/signup",
    summary="Create an account and sign in",
    status_code=status.HTTP_201_CREATED,
    responses=errors(409),
)
def signup(body: SignupIn, service: AuthServiceDep) -> SessionOut:
    return service.signup(body.email, body.password)


@router.post(
    "/demo",
    summary="Sign in as the demo learner (only where ENABLE_DEMO_LOGIN is set)",
    responses=errors(404),
)
def demo_login(service: AuthServiceDep) -> SessionOut:
    return service.demo_login()


@router.post(
    "/logout",
    summary="Sign out (the client then discards its token)",
    status_code=status.HTTP_204_NO_CONTENT,
    responses=errors(401),
)
def logout(_: CurrentUser) -> Response:
    # Tokens are stateless, so there is nothing to delete server-side; requiring a valid session
    # keeps the endpoint honest and gives clients one place to end a session.
    return Response(status_code=status.HTTP_204_NO_CONTENT)

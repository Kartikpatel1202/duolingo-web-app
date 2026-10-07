"""Sign-in and session checks. Rules live in `app.domain.auth`; this wires them to users."""

import secrets
from datetime import timedelta

from sqlalchemy.exc import IntegrityError

from app.core.config import Settings
from app.domain import auth
from app.domain.errors import (
    DemoLoginUnavailable,
    EmailTaken,
    InvalidCredentials,
    NotAuthenticated,
)
from app.domain.rules import AVATAR_COLORS, MAX_HEARTS, STARTING_GEMS
from app.models import User
from app.repositories import ContentRepository, UserRepository
from app.schemas.auth import SessionOut
from app.services.context import ServiceContext


class AuthService:
    def __init__(self, ctx: ServiceContext, settings: Settings) -> None:
        self._ctx = ctx
        self._settings = settings
        self._users = UserRepository(ctx.session)
        self._content = ContentRepository(ctx.session)

    def signup(self, email: str, password: str) -> SessionOut:
        """Create a learner in the `users` table and sign them in.

        The new account starts like any learner: enrolled in the course, full hearts, the starting
        gems and no progress. Only the password hash is stored.
        """
        email = email.strip().lower()
        if self._users.get_by_login(email) is not None:
            raise EmailTaken()
        courses = self._content.list_courses()
        now = self._ctx.now()
        base = auth.username_from_email(email, set())
        user = User(
            username=auth.username_from_email(email, self._users.usernames_starting_with(base)),
            display_name=auth.display_name_from_email(email),
            avatar_color=AVATAR_COLORS[self._users.count() % len(AVATAR_COLORS)],
            email=email,
            password_hash=auth.hash_password(
                password, secrets.token_bytes(16), self._settings.password_iterations
            ),
            current_course_id=courses[0].id if courses else None,
            hearts=MAX_HEARTS,
            hearts_updated_at=now,
            gems=STARTING_GEMS,
            created_at=now,
        )
        self._users.add(user)
        try:
            self._ctx.session.commit()
        except IntegrityError:  # the same email was registered by a concurrent request
            self._ctx.session.rollback()
            raise EmailTaken() from None
        return self._session_for(user)

    def login(self, identifier: str, password: str) -> SessionOut:
        """Check an email (or username) and password; on success issue a session token.

        The same error is raised for an unknown account and a wrong password, so the response does
        not reveal which accounts exist.
        """
        user = self._users.get_by_login(identifier.strip().lower())
        if user is None or not auth.verify_password(password, user.password_hash):
            raise InvalidCredentials()
        return self._session_for(user)

    def demo_login(self) -> SessionOut:
        """Sign in as the seeded learner without a password, for a demo shared as a link.

        Only when the deployment enables it (`ENABLE_DEMO_LOGIN`). It answers "not found" both
        when it is switched off and when the database has no seeded learner, so the endpoint
        looks absent wherever it cannot be used.
        """
        if not self._settings.enable_demo_login:
            raise DemoLoginUnavailable()
        user = self._users.get_by_login(self._settings.default_username)
        if user is None:
            raise DemoLoginUnavailable()
        return self._session_for(user)

    def _session_for(self, user: User) -> SessionOut:
        expires_at = self._ctx.now() + timedelta(days=self._settings.session_days)
        return SessionOut(
            token=auth.issue_token(user.id, expires_at, self._settings.secret_key),
            expires_at=expires_at,
        )

    def user_for_token(self, token: str | None) -> User:
        """The learner a bearer token belongs to; raises NotAuthenticated otherwise."""
        if not token:
            raise NotAuthenticated()
        user_id = auth.read_token(token, self._ctx.now(), self._settings.secret_key)
        user = self._users.get(user_id) if user_id is not None else None
        if user is None:
            raise NotAuthenticated()
        return user

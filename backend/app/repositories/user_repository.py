from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models import User


class UserRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def get(self, user_id: int) -> User | None:
        return self._session.get(User, user_id)

    def get_by_login(self, identifier: str) -> User | None:
        """A user by email or username (both stored lower-case)."""
        statement = select(User).where(or_(User.email == identifier, User.username == identifier))
        return self._session.scalars(statement).one_or_none()

    def usernames_starting_with(self, prefix: str) -> set[str]:
        statement = select(User.username).where(User.username.startswith(prefix))
        return set(self._session.scalars(statement).all())

    def count(self) -> int:
        return self._session.scalar(select(func.count()).select_from(User)) or 0

    def add(self, user: User) -> None:
        self._session.add(user)

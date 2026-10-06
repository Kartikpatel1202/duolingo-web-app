from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Achievement, UserAchievement


class AchievementRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def catalog(self) -> Sequence[Achievement]:
        statement = select(Achievement).order_by(Achievement.metric, Achievement.threshold)
        return self._session.scalars(statement).all()

    def earned(self, user_id: int) -> dict[int, UserAchievement]:
        statement = select(UserAchievement).where(UserAchievement.user_id == user_id)
        return {row.achievement_id: row for row in self._session.scalars(statement)}

    def earned_by_attempt(self, attempt_id: str) -> Sequence[Achievement]:
        statement = (
            select(Achievement)
            .join(UserAchievement, UserAchievement.achievement_id == Achievement.id)
            .where(UserAchievement.lesson_attempt_id == attempt_id)
            .order_by(Achievement.id)
        )
        return self._session.scalars(statement).all()

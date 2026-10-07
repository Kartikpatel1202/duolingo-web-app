"""Shared attempt access rules used by answer checking and lesson completion."""

from datetime import datetime

from sqlalchemy.orm import Session

from app.domain import challenge
from app.domain.enums import AttemptStatus
from app.domain.errors import AttemptFailed, AttemptInvalid, AttemptNotFound
from app.models import LessonAttempt, User
from app.repositories import AttemptRepository


def get_owned_attempt(
    attempts: AttemptRepository, user: User, lesson_id: int, attempt_id: str
) -> LessonAttempt:
    """The attempt, if it belongs to this learner and this lesson.

    Another learner's attempt is reported as "not found" so attempt ids can't be probed.
    """
    attempt = attempts.get(attempt_id)
    if attempt is None or attempt.user_id != user.id:
        raise AttemptNotFound(attempt_id=attempt_id)
    if attempt.lesson_id != lesson_id:
        raise AttemptInvalid(
            "This attempt belongs to a different lesson.",
            attempt_id=attempt_id,
            attempt_lesson_id=attempt.lesson_id,
        )
    return attempt


def ensure_not_ended(session: Session, attempt: LessonAttempt, now: datetime) -> None:
    """Challenges end when their time runs out. Expiry is recorded the first time the server
    notices it (there is no background job), then every further action is refused."""
    if attempt.status is AttemptStatus.FAILED:
        raise AttemptFailed(attempt_id=attempt.id)
    if attempt.status is AttemptStatus.IN_PROGRESS and challenge.is_expired(
        attempt.mode, attempt.started_at, now
    ):
        attempt.status = AttemptStatus.FAILED
        session.commit()
        raise AttemptFailed(
            "Time's up! This challenge has ended.", attempt_id=attempt.id, reason="time_up"
        )

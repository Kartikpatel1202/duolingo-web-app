"""Shared attempt access rules used by answer checking and lesson completion."""

from app.domain.errors import AttemptInvalid, AttemptNotFound
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

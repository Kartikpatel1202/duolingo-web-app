"""Domain errors.

Services and domain rules raise these; they never know about HTTP. Each error belongs to one
category (NotFound, AccessDenied, Conflict, InvalidInput) and `app.core.errors` maps categories to
HTTP status codes in a single table.
"""

from typing import Any, ClassVar


class DomainError(Exception):
    code: ClassVar[str] = "DOMAIN_ERROR"
    message: ClassVar[str] = "The request could not be completed."

    def __init__(self, message: str | None = None, **details: Any) -> None:
        self.detail_message = message or self.message
        self.details = details
        super().__init__(self.detail_message)


# --- categories -------------------------------------------------------------------------------


class NotFound(DomainError):
    pass


class AccessDenied(DomainError):
    pass


class Conflict(DomainError):
    pass


class InvalidInput(DomainError):
    pass


# --- not found --------------------------------------------------------------------------------


class UserNotFound(NotFound):
    code = "USER_NOT_FOUND"
    message = "The learner does not exist. Run the seed command: python -m app.seed"


class CourseNotFound(NotFound):
    code = "COURSE_NOT_FOUND"
    message = "Course not found."


class SkillNotFound(NotFound):
    code = "SKILL_NOT_FOUND"
    message = "Skill not found."


class LessonNotFound(NotFound):
    code = "LESSON_NOT_FOUND"
    message = "Lesson not found."


class AttemptNotFound(NotFound):
    code = "ATTEMPT_NOT_FOUND"
    message = "Lesson attempt not found."


class ExerciseNotFound(NotFound):
    code = "EXERCISE_NOT_FOUND"
    message = "This exercise is not part of the lesson."


# --- access -----------------------------------------------------------------------------------


class LessonLocked(AccessDenied):
    code = "LESSON_LOCKED"
    message = "This lesson is locked."


# --- conflicts (request is well-formed but the current state does not allow it) ---------------


class AttemptInvalid(Conflict):
    code = "ATTEMPT_INVALID"
    message = "This attempt cannot be used for this lesson."


class AlreadyCompleted(Conflict):
    code = "ALREADY_COMPLETED"
    message = "This lesson attempt is already completed."


class ExerciseAlreadySolved(Conflict):
    code = "EXERCISE_ALREADY_SOLVED"
    message = "This exercise has already been answered correctly in this attempt."


class DuplicateSubmission(Conflict):
    code = "DUPLICATE_SUBMISSION"
    message = "This submission_id was already used for a different answer."


class OutOfHearts(Conflict):
    code = "OUT_OF_HEARTS"
    message = "You have no hearts left."


class LessonNotFinished(Conflict):
    code = "LESSON_NOT_FINISHED"
    message = "Every exercise must be answered correctly before completing the lesson."


class HeartsFull(Conflict):
    code = "HEARTS_FULL"
    message = "Your hearts are already full."


class InsufficientGems(Conflict):
    code = "INSUFFICIENT_GEMS"
    message = "You do not have enough gems."


# --- invalid input (semantically invalid payload) ---------------------------------------------


class InvalidAnswer(InvalidInput):
    code = "INVALID_ANSWER"
    message = "The answer is not valid for this exercise."

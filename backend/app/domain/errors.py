"""Domain errors.

Services and domain rules raise these; they never know about HTTP. Each error belongs to one
category (Unauthenticated, NotFound, AccessDenied, Conflict, InvalidInput) and `app.core.errors`
maps categories to HTTP status codes in a single table.
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


class Unauthenticated(DomainError):
    pass


# --- unauthenticated ----------------------------------------------------------------------------


class NotAuthenticated(Unauthenticated):
    code = "NOT_AUTHENTICATED"
    message = "Please log in to continue."


class InvalidCredentials(Unauthenticated):
    code = "INVALID_CREDENTIALS"
    message = "Wrong email or password."


# --- not found --------------------------------------------------------------------------------


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


class UnitNotFound(NotFound):
    code = "UNIT_NOT_FOUND"
    message = "Unit not found."


class GuidebookNotFound(NotFound):
    code = "GUIDEBOOK_NOT_FOUND"
    message = "This unit has no guidebook yet."


class ShopItemNotFound(NotFound):
    code = "SHOP_ITEM_NOT_FOUND"
    message = "That item is not sold in the shop."


class QuestNotFound(NotFound):
    code = "QUEST_NOT_FOUND"
    message = "Quest not found."


class ExerciseNotFound(NotFound):
    code = "EXERCISE_NOT_FOUND"
    message = "This exercise is not part of the lesson."


# --- access -----------------------------------------------------------------------------------


class LessonLocked(AccessDenied):
    code = "LESSON_LOCKED"
    message = "This lesson is locked."


class LegendaryLocked(AccessDenied):
    code = "LEGENDARY_LOCKED"
    message = "Complete this lesson first to unlock its Legendary challenge."


# --- conflicts (request is well-formed but the current state does not allow it) ---------------


class EmailTaken(Conflict):
    code = "EMAIL_TAKEN"
    message = "An account with this email already exists."


class AttemptInvalid(Conflict):
    code = "ATTEMPT_INVALID"
    message = "This attempt cannot be used for this lesson."


class AttemptFailed(Conflict):
    code = "ATTEMPT_FAILED"
    message = "This challenge has ended. Start a new one to try again."


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


class ItemLimitReached(Conflict):
    code = "ITEM_LIMIT_REACHED"
    message = "You already have as many of these as you can hold."


class RewardNotAvailable(Conflict):
    code = "REWARD_NOT_AVAILABLE"
    message = "This reward isn't unlocked yet."


class RewardAlreadyClaimed(Conflict):
    code = "REWARD_ALREADY_CLAIMED"
    message = "You already claimed this reward."


class InsufficientGems(Conflict):
    code = "INSUFFICIENT_GEMS"
    message = "You do not have enough gems."


# --- invalid input (semantically invalid payload) ---------------------------------------------


class InvalidAnswer(InvalidInput):
    code = "INVALID_ANSWER"
    message = "The answer is not valid for this exercise."


class InvalidMonth(InvalidInput):
    code = "INVALID_MONTH"
    message = "Month must look like YYYY-MM."

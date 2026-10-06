"""Exercise types: one module per type, each with content/solution/answer models and a checker."""

from app.domain.exercises.base import CheckResult, ExerciseChecker, ExerciseDefinitionError
from app.domain.exercises.registry import CHECKERS, get_checker

__all__ = ["CHECKERS", "CheckResult", "ExerciseChecker", "ExerciseDefinitionError", "get_checker"]

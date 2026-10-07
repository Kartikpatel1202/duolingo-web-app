"""OpenAPI documentation for error responses, so they appear in the generated client types."""

from typing import Any

from app.schemas.common import ErrorResponse

_DESCRIPTIONS = {
    401: "Not signed in, or the email/password is wrong (NOT_AUTHENTICATED, INVALID_CREDENTIALS)",
    403: "Forbidden (e.g. LESSON_LOCKED)",
    404: "Resource not found",
    409: "Conflict with the current state (e.g. OUT_OF_HEARTS)",
    422: "Invalid request (VALIDATION_ERROR, INVALID_ANSWER)",
}


def errors(*status_codes: int) -> dict[int | str, dict[str, Any]]:
    codes = sorted({*status_codes, 422})
    return {code: {"model": ErrorResponse, "description": _DESCRIPTIONS[code]} for code in codes}

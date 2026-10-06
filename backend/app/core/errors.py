"""Central mapping of errors to the API error envelope.

    {"error": {"code": "LESSON_LOCKED", "message": "This lesson is locked.", "details": {}}}

Domain errors are mapped by category, so adding a new error never requires touching a router.
"""

import logging
from typing import Any

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.domain.errors import AccessDenied, Conflict, DomainError, InvalidInput, NotFound

logger = logging.getLogger(__name__)

STATUS_BY_CATEGORY: dict[type[DomainError], int] = {
    NotFound: 404,
    AccessDenied: 403,
    Conflict: 409,
    InvalidInput: 422,
}

_HTTP_CODES = {404: "NOT_FOUND", 405: "METHOD_NOT_ALLOWED"}


def status_for(error: DomainError) -> int:
    for category, status in STATUS_BY_CATEGORY.items():
        if isinstance(error, category):
            return status
    return 400


def error_body(code: str, message: str, details: dict[str, Any] | None = None) -> dict[str, Any]:
    return {"error": {"code": code, "message": message, "details": jsonable_encoder(details or {})}}


async def _domain_error_handler(_: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, DomainError)
    return JSONResponse(
        status_code=status_for(exc),
        content=error_body(exc.code, exc.detail_message, exc.details),
    )


async def _validation_error_handler(_: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, RequestValidationError)
    fields = [
        {"location": list(err["loc"]), "message": err["msg"], "type": err["type"]}
        for err in exc.errors()
    ]
    return JSONResponse(
        status_code=422,
        content=error_body("VALIDATION_ERROR", "The request is invalid.", {"fields": fields}),
    )


async def _http_error_handler(_: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, StarletteHTTPException)
    code = _HTTP_CODES.get(exc.status_code, "HTTP_ERROR")
    return JSONResponse(status_code=exc.status_code, content=error_body(code, str(exc.detail)))


async def _unhandled_error_handler(_: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error", exc_info=exc)
    return JSONResponse(
        status_code=500,
        content=error_body("INTERNAL_ERROR", "Something went wrong. Please try again."),
    )


def register_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(DomainError, _domain_error_handler)
    app.add_exception_handler(RequestValidationError, _validation_error_handler)
    app.add_exception_handler(StarletteHTTPException, _http_error_handler)
    app.add_exception_handler(Exception, _unhandled_error_handler)

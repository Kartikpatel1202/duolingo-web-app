from datetime import datetime

from pydantic import Field

from app.domain.rules import MIN_PASSWORD_LENGTH
from app.schemas.common import ApiModel


class LoginIn(ApiModel):
    identifier: str = Field(min_length=1, max_length=254, description="Email address or username.")
    password: str = Field(min_length=1, max_length=128)


class SignupIn(ApiModel):
    email: str = Field(
        max_length=254,
        pattern=r"^[^\s@]+@[^\s@]+\.[^\s@]+$",
        description="Becomes the sign-in name; stored lower-case.",
        examples=["sam@example.com"],
    )
    password: str = Field(min_length=MIN_PASSWORD_LENGTH, max_length=128)


class SessionOut(ApiModel):
    token: str = Field(description="Send as `Authorization: Bearer <token>` on every request.")
    expires_at: datetime

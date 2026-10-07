"""Environment-driven configuration (12-factor). Product rules live in `app.domain.rules`."""

from functools import lru_cache
from typing import Literal
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEV_SECRET_KEY = "dev-only-secret-change-me"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: Literal["development", "test", "production"] = "development"
    database_url: str = "sqlite:///./data/app.db"
    cors_origins: str = "http://localhost:3000"
    app_timezone: str = "UTC"
    default_username: str = "learner"
    enable_test_routes: bool = False
    # Signs session tokens. The default is for local development only (see the validator below).
    secret_key: str = DEV_SECRET_KEY
    session_days: int = 30
    # PBKDF2 work factor for new password hashes (tests lower it to keep the suite fast).
    password_iterations: int = 210_000

    @field_validator("app_timezone")
    @classmethod
    def _valid_timezone(cls, value: str) -> str:
        try:
            ZoneInfo(value)
        except (ZoneInfoNotFoundError, ValueError) as exc:
            raise ValueError(f"APP_TIMEZONE must be an IANA timezone name, got {value!r}") from exc
        return value

    @model_validator(mode="after")
    def _no_test_routes_in_production(self) -> "Settings":
        # The test router can reset the database and reveal answers; production must refuse it.
        if self.app_env == "production" and self.enable_test_routes:
            raise ValueError("ENABLE_TEST_ROUTES must not be enabled when APP_ENV=production")
        # Anyone who knows the signing secret can forge a session, so production needs its own.
        if self.app_env == "production" and self.secret_key == DEV_SECRET_KEY:
            raise ValueError("SECRET_KEY must be set when APP_ENV=production")
        return self

    @property
    def timezone(self) -> ZoneInfo:
        return ZoneInfo(self.app_timezone)

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()

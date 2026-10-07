"""The test-only router (DB reset, answer key) must never be reachable outside test setups."""

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.core.clock import FixedClock
from app.core.config import Settings
from app.main import create_app


def _settings(**overrides: object) -> Settings:
    return Settings(_env_file=None, database_url="sqlite://", **overrides)  # type: ignore[arg-type]


def test_test_routes_are_off_by_default() -> None:
    assert _settings().enable_test_routes is False


def test_production_refuses_test_routes() -> None:
    with pytest.raises(ValidationError, match="ENABLE_TEST_ROUTES"):
        _settings(app_env="production", secret_key="a-real-secret", enable_test_routes=True)


def test_production_refuses_the_development_signing_secret() -> None:
    with pytest.raises(ValidationError, match="SECRET_KEY"):
        _settings(app_env="production")


def test_default_app_does_not_mount_test_routes(clock: FixedClock) -> None:
    app = create_app(_settings(app_env="production", secret_key="a-real-secret"), clock)
    paths = app.openapi()["paths"]
    assert not [path for path in paths if path.startswith("/api/test")]
    with TestClient(app) as client:
        assert client.get("/api/test/lessons/1/answer-key").status_code == 404
        assert client.post("/api/test/reset", json={}).status_code == 404


def test_answer_key_is_only_served_with_test_routes(client: TestClient) -> None:
    # The suite's own app enables test routes; this documents what the guard is protecting.
    assert client.get("/api/test/lessons/1/answer-key").status_code == 200

"""Shared fixtures.

Every test gets a fresh in-memory database seeded with the real course content (no demo progress)
and a FixedClock it can move. Wednesday 2026-10-07 10:00 UTC is "now" unless a test changes it.
"""

from collections.abc import Iterator
from datetime import UTC, datetime

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.clock import FixedClock
from app.core.config import Settings
from app.main import create_app
from app.seed.seeder import reset_and_seed
from tests.helpers import Api, sign_in

NOW = datetime(2026, 10, 7, 10, 0, tzinfo=UTC)  # a Wednesday


@pytest.fixture
def clock() -> FixedClock:
    return FixedClock(NOW)


@pytest.fixture
def settings() -> Settings:
    return Settings(
        _env_file=None,
        app_env="test",
        database_url="sqlite://",
        app_timezone="UTC",
        enable_test_routes=True,
        password_iterations=1_000,  # hashing strength is not what these tests measure
    )


@pytest.fixture
def app(settings: Settings, clock: FixedClock) -> FastAPI:
    application = create_app(settings, clock)
    reset_and_seed(
        application.state.engine,
        application.state.session_factory,
        clock,
        settings,
        demo_progress=False,
    )
    return application


@pytest.fixture
def anonymous(app: FastAPI) -> Iterator[TestClient]:
    """A client with no session, for testing sign-in and the 401 responses."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def client(app: FastAPI) -> Iterator[TestClient]:
    """A client signed in as the seeded learner (through the real login endpoint)."""
    with TestClient(app) as test_client:
        yield sign_in(test_client)


@pytest.fixture
def db(app: FastAPI) -> Iterator[Session]:
    """Direct database access for assertions that the API does not expose."""
    with app.state.session_factory() as session:
        yield session


@pytest.fixture
def api(client: TestClient, app: FastAPI) -> Api:
    return Api(client, app.state.session_factory)

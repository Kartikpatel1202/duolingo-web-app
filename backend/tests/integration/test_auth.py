"""Sign-in, sessions and the 401 boundary around every learner endpoint."""

from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from httpx2 import Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.clock import FixedClock
from app.core.config import Settings
from app.domain import auth
from app.models import User
from app.seed.people import LEARNER_EMAIL, LEARNER_PASSWORD
from tests.helpers import Api

NOW = datetime(2026, 10, 7, 10, 0, tzinfo=UTC)


def login(client: TestClient, identifier: str, password: str) -> TestClient:
    response = client.post("/api/auth/login", json={"identifier": identifier, "password": password})
    assert response.status_code == 200, response.text
    client.headers["Authorization"] = f"Bearer {response.json()['token']}"
    return client


# --- pure rules -------------------------------------------------------------------------------


def test_password_hashes_verify_and_do_not_contain_the_password() -> None:
    stored = auth.hash_password("learn-spanish", b"salt", 1_000)
    assert "learn-spanish" not in stored
    assert auth.verify_password("learn-spanish", stored)
    assert not auth.verify_password("learn-spanish ", stored)
    assert not auth.verify_password("learn-spanish", None)
    assert not auth.verify_password("learn-spanish", "not-a-hash")


def test_tokens_identify_the_user_until_they_expire() -> None:
    token = auth.issue_token(7, NOW + timedelta(days=1), "secret")
    assert auth.read_token(token, NOW, "secret") == 7
    assert auth.read_token(token, NOW + timedelta(days=2), "secret") is None


@pytest.mark.parametrize("tamper", ["user", "expiry", "signature", "secret", "garbage"])
def test_forged_tokens_are_rejected(tamper: str) -> None:
    user_id, expires, signature = auth.issue_token(7, NOW + timedelta(days=1), "secret").split(".")
    forged = {
        "user": f"8.{expires}.{signature}",
        "expiry": f"{user_id}.{int(expires) + 999}.{signature}",
        "signature": f"{user_id}.{expires}.{signature[:-2]}xx",
        "secret": f"{user_id}.{expires}.{signature}",
        "garbage": "not.a-token",
    }[tamper]
    secret = "another-secret" if tamper == "secret" else "secret"
    assert auth.read_token(forged, NOW, secret) is None


# --- login ------------------------------------------------------------------------------------


def test_login_with_email_returns_a_session_that_identifies_the_learner(
    anonymous: TestClient,
) -> None:
    client = login(anonymous, LEARNER_EMAIL, LEARNER_PASSWORD)
    me = client.get("/api/users/me")
    assert me.status_code == 200
    assert me.json()["username"] == "learner"


def test_login_accepts_the_username_and_ignores_email_case(anonymous: TestClient) -> None:
    for identifier in ("learner", LEARNER_EMAIL.upper(), f"  {LEARNER_EMAIL} "):
        response = anonymous.post(
            "/api/auth/login", json={"identifier": identifier, "password": LEARNER_PASSWORD}
        )
        assert response.status_code == 200, identifier


@pytest.mark.parametrize(
    ("identifier", "password"),
    [
        (LEARNER_EMAIL, "wrong-password"),
        ("nobody@example.com", LEARNER_PASSWORD),
        ("maria", LEARNER_PASSWORD),  # a seeded rival: exists, but has no credentials
    ],
)
def test_wrong_credentials_get_the_same_401(
    anonymous: TestClient, identifier: str, password: str
) -> None:
    response = anonymous.post(
        "/api/auth/login", json={"identifier": identifier, "password": password}
    )
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "INVALID_CREDENTIALS"
    assert response.json()["error"]["message"] == "Wrong email or password."


def test_login_validates_its_input(anonymous: TestClient) -> None:
    assert (
        anonymous.post("/api/auth/login", json={"identifier": "", "password": ""}).status_code
        == 422
    )
    assert anonymous.post("/api/auth/login", json={}).status_code == 422


def test_the_password_is_stored_only_as_a_hash(anonymous: TestClient, db: Session) -> None:
    learner = db.scalars(select(User).where(User.username == "learner")).one()
    assert learner.email == LEARNER_EMAIL
    assert learner.password_hash and LEARNER_PASSWORD not in learner.password_hash
    assert learner.password_hash.startswith("pbkdf2_sha256$")


# --- demo link --------------------------------------------------------------------------------


def test_demo_login_is_off_by_default(anonymous: TestClient) -> None:
    response = anonymous.post("/api/auth/demo")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "DEMO_LOGIN_UNAVAILABLE"


def test_demo_login_signs_in_as_the_seeded_learner_when_enabled(
    anonymous: TestClient, settings: Settings
) -> None:
    settings.enable_demo_login = True
    response = anonymous.post("/api/auth/demo")
    assert response.status_code == 200, response.text
    anonymous.headers["Authorization"] = f"Bearer {response.json()['token']}"
    assert anonymous.get("/api/users/me").json()["username"] == "learner"


def test_demo_login_needs_the_seeded_learner(
    anonymous: TestClient, settings: Settings, db: Session
) -> None:
    settings.enable_demo_login = True
    learner = db.scalars(select(User).where(User.username == "learner")).one()
    learner.username = "someone-else"
    learner.email = "someone@example.com"
    db.commit()
    assert anonymous.post("/api/auth/demo").status_code == 404


# --- the 401 boundary -------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("method", "path"),
    [
        ("get", "/api/users/me"),
        ("get", "/api/courses/1/path"),
        ("get", "/api/lessons/1"),
        ("post", "/api/lessons/1/attempts"),
        ("get", "/api/progress"),
        ("get", "/api/hearts"),
        ("post", "/api/hearts/refill"),
        ("get", "/api/leaderboard"),
        ("get", "/api/profile"),
        ("get", "/api/streak"),
        ("get", "/api/shop"),
        ("get", "/api/quests"),
        ("get", "/api/feed"),
        ("post", "/api/auth/logout"),
    ],
)
def test_learner_endpoints_require_a_session(anonymous: TestClient, method: str, path: str) -> None:
    response = anonymous.request(method, path)
    assert response.status_code == 401, path
    assert response.json()["error"]["code"] == "NOT_AUTHENTICATED"


@pytest.mark.parametrize("header", ["Bearer nonsense", "Bearer ", "Basic abc", "token"])
def test_bad_authorization_headers_are_rejected(anonymous: TestClient, header: str) -> None:
    response = anonymous.get("/api/users/me", headers={"Authorization": header})
    assert response.status_code == 401


def test_public_content_needs_no_session(anonymous: TestClient) -> None:
    assert anonymous.get("/api/health").status_code == 200
    assert anonymous.get("/api/courses").status_code == 200


def test_sessions_expire(anonymous: TestClient, clock: FixedClock, settings: Settings) -> None:
    client = login(anonymous, LEARNER_EMAIL, LEARNER_PASSWORD)
    clock.advance(timedelta(days=settings.session_days - 1))
    assert client.get("/api/users/me").status_code == 200
    clock.advance(timedelta(days=2))
    assert client.get("/api/users/me").status_code == 401


def test_logout_succeeds_for_a_signed_in_learner(client: TestClient) -> None:
    assert client.post("/api/auth/logout").status_code == 204


# --- sign-up ----------------------------------------------------------------------------------


def signup(client: TestClient, email: str, password: str = "correct-horse") -> Response:
    return client.post("/api/auth/signup", json={"email": email, "password": password})


def test_signup_creates_a_learner_and_signs_them_in(anonymous: TestClient, db: Session) -> None:
    response = signup(anonymous, "Sam.Lee@Example.com")
    assert response.status_code == 201
    anonymous.headers["Authorization"] = f"Bearer {response.json()['token']}"

    me = anonymous.get("/api/users/me").json()
    assert (me["username"], me["display_name"]) == ("samlee", "Sam")
    assert (me["total_xp"], me["gems"], me["hearts"]["current"]) == (0, 500, 5)
    assert me["current_course_id"] == 1

    stored = db.scalars(select(User).where(User.email == "sam.lee@example.com")).one()
    assert stored.password_hash and "correct-horse" not in stored.password_hash
    assert stored.is_bot is False


def test_a_registered_learner_can_log_in_later_and_starts_from_scratch(
    anonymous: TestClient,
) -> None:
    assert signup(anonymous, "sam@example.com").status_code == 201
    client = login(anonymous, "sam@example.com", "correct-horse")

    path = client.get("/api/courses/1/path").json()
    statuses = [skill["status"] for unit in path["units"] for skill in unit["skills"]]
    # Nothing played yet: only the first skill of each unit is open ("Jump here").
    assert statuses == (["available"] + ["locked"] * 3) * (len(statuses) // 4)
    assert client.get("/api/leaderboard").json()["current_user"]["xp"] == 0


def test_each_learner_has_their_own_progress(anonymous: TestClient, api: Api) -> None:
    api.play(api.lesson_id(1, 1, 1))  # the seeded learner earns XP
    token = signup(anonymous, "sam@example.com").json()["token"]
    newcomer = anonymous.get("/api/users/me", headers={"Authorization": f"Bearer {token}"}).json()
    assert newcomer["total_xp"] == 0
    assert api.get("/api/users/me")["total_xp"] > 0


def test_an_email_can_only_be_registered_once(anonymous: TestClient) -> None:
    assert signup(anonymous, "sam@example.com").status_code == 201
    for email in ("sam@example.com", "SAM@example.com", LEARNER_EMAIL):
        duplicate = signup(anonymous, email)
        assert duplicate.status_code == 409, email
        assert duplicate.json()["error"]["code"] == "EMAIL_TAKEN"


def test_usernames_stay_unique_when_emails_share_a_name(anonymous: TestClient) -> None:
    names = []
    for email in ("sam@example.com", "sam@example.org", "learner@example.com"):
        token = signup(anonymous, email).json()["token"]
        me = anonymous.get("/api/users/me", headers={"Authorization": f"Bearer {token}"}).json()
        names.append(me["username"])
    assert names == ["sam", "sam2", "learner2"]


@pytest.mark.parametrize(
    ("email", "password"),
    [
        ("not-an-email", "correct-horse"),
        ("sam@example", "correct-horse"),
        ("sam@example.com", "short"),
        ("", ""),
    ],
)
def test_signup_validates_email_and_password(
    anonymous: TestClient, email: str, password: str
) -> None:
    assert signup(anonymous, email, password).status_code == 422

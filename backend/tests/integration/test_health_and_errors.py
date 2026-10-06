from fastapi.testclient import TestClient


def assert_error(body: dict[str, object], code: str) -> None:
    assert set(body) == {"error"}
    error = body["error"]
    assert isinstance(error, dict)
    assert set(error) == {"code", "message", "details"}
    assert error["code"] == code
    assert isinstance(error["message"], str) and error["message"]


def test_health(client: TestClient) -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}


def test_unknown_route_uses_error_envelope(client: TestClient) -> None:
    response = client.get("/api/nope")
    assert response.status_code == 404
    assert_error(response.json(), "NOT_FOUND")


def test_domain_error_uses_error_envelope(client: TestClient) -> None:
    response = client.get("/api/courses/999")
    assert response.status_code == 404
    assert_error(response.json(), "COURSE_NOT_FOUND")
    assert response.json()["error"]["details"] == {"course_id": 999}


def test_validation_error_uses_error_envelope(client: TestClient) -> None:
    response = client.post("/api/lessons/1/check", json={"attempt_id": "x"})
    assert response.status_code == 422
    body = response.json()
    assert_error(body, "VALIDATION_ERROR")
    assert body["error"]["details"]["fields"]


def test_path_parameter_validation(client: TestClient) -> None:
    response = client.get("/api/lessons/not-a-number")
    assert response.status_code == 422
    assert_error(response.json(), "VALIDATION_ERROR")


def test_missing_learner_is_reported_clearly(client: TestClient, db) -> None:  # type: ignore[no-untyped-def]
    from app.models import User

    learner = db.query(User).filter_by(username="learner").one()
    learner.username = "someone-else"
    db.commit()
    response = client.get("/api/users/me")
    assert response.status_code == 404
    assert_error(response.json(), "USER_NOT_FOUND")

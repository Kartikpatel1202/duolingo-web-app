"""OpenAPI contract quality and architecture guard rails."""

import re
from pathlib import Path
from typing import get_args

from fastapi.testclient import TestClient

from app.domain.enums import ExerciseType
from app.schemas.exercise import AnswerIn, ExerciseOut

APP_DIR = Path(__file__).resolve().parents[2] / "app"


def union_types(annotated: object) -> set[str]:
    union, *_ = get_args(annotated)
    return {get_args(model.model_fields["type"].annotation)[0] for model in get_args(union)}


def test_every_exercise_type_is_in_the_api_unions() -> None:
    expected = {member.value for member in ExerciseType}
    assert union_types(ExerciseOut) == expected
    assert union_types(AnswerIn) == expected


def test_openapi_documents_every_endpoint(client: TestClient) -> None:
    spec = client.get("/openapi.json").json()
    expected = {
        ("get", "/api/health"),
        ("get", "/api/users/me"),
        ("patch", "/api/users/me"),
        ("get", "/api/courses"),
        ("get", "/api/courses/{course_id}"),
        ("get", "/api/courses/{course_id}/path"),
        ("get", "/api/skills/{skill_id}"),
        ("get", "/api/lessons/{lesson_id}"),
        ("post", "/api/lessons/{lesson_id}/attempts"),
        ("post", "/api/lessons/{lesson_id}/check"),
        ("post", "/api/progress/lesson/{lesson_id}/complete"),
        ("get", "/api/progress"),
        ("get", "/api/hearts"),
        ("post", "/api/hearts/refill"),
        ("get", "/api/leaderboard"),
        ("get", "/api/profile"),
    }
    documented = {(m, p) for p, ops in spec["paths"].items() for m in ops}
    assert expected <= documented
    for path, operations in spec["paths"].items():
        for method, operation in operations.items():
            assert operation.get("summary"), f"{method.upper()} {path} has no summary"
            assert (
                "200" in operation["responses"]
                or "201" in operation["responses"]
                or ("204" in operation["responses"])
            )


def test_openapi_exposes_discriminated_unions_and_error_schema(client: TestClient) -> None:
    spec = client.get("/openapi.json").json()
    schemas = spec["components"]["schemas"]
    assert "ErrorResponse" in schemas
    lesson_exercises = schemas["LessonOut"]["properties"]["exercises"]["items"]
    assert lesson_exercises["discriminator"]["propertyName"] == "type"
    assert set(lesson_exercises["discriminator"]["mapping"]) == {t.value for t in ExerciseType}
    check = spec["paths"]["/api/lessons/{lesson_id}/check"]["post"]["responses"]
    assert check["409"]["content"]["application/json"]["schema"]["$ref"].endswith("ErrorResponse")
    # No solution-bearing schema is reachable from the public lesson contract.
    assert not any("Solution" in name for name in schemas)


def test_time_is_only_read_through_the_clock() -> None:
    pattern = re.compile(r"datetime\.now\(|datetime\.utcnow\(|date\.today\(|time\.time\(")
    offenders = [
        str(path.relative_to(APP_DIR))
        for path in APP_DIR.rglob("*.py")
        if pattern.search(path.read_text(encoding="utf-8"))
    ]
    assert offenders == [str(Path("core/clock.py"))]


def test_routers_do_not_touch_the_database_or_models() -> None:
    routers = (APP_DIR / "api" / "routers").glob("*.py")
    for router in routers:
        source = router.read_text(encoding="utf-8")
        assert "app.models" not in source, router.name
        assert "app.repositories" not in source, router.name
        assert "session.add" not in source and "commit(" not in source, router.name

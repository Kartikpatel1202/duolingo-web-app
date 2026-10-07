from fastapi import APIRouter

from app.api.deps import CourseServiceDep, CurrentUser, GuidebookServiceDep
from app.api.responses import errors
from app.schemas.course import (
    CourseDetailOut,
    CourseListOut,
    GuidebookOut,
    PathOut,
    SkillDetailOut,
)

router = APIRouter(tags=["courses"])


@router.get("/courses", summary="List courses")
def list_courses(service: CourseServiceDep) -> CourseListOut:
    return service.list_courses()


@router.get(
    "/courses/{course_id}",
    summary="Course detail with the learner's lesson count",
    responses=errors(404),
)
def get_course(course_id: int, user: CurrentUser, service: CourseServiceDep) -> CourseDetailOut:
    return service.course_detail(user, course_id)


@router.get(
    "/courses/{course_id}/path",
    summary="Learning path: units and skills with the learner's status",
    responses=errors(404),
)
def get_path(course_id: int, user: CurrentUser, service: CourseServiceDep) -> PathOut:
    return service.path(user, course_id)


@router.get(
    "/skills/{skill_id}",
    summary="Skill with its lessons and their status",
    tags=["skills"],
    responses=errors(404),
)
def get_skill(skill_id: int, user: CurrentUser, service: CourseServiceDep) -> SkillDetailOut:
    return service.skill_detail(user, skill_id)


@router.get(
    "/units/{unit_id}/guidebook",
    summary="Unit guidebook: key phrases, vocabulary and tips",
    tags=["guidebook"],
    responses=errors(404),
)
def get_guidebook(unit_id: int, service: GuidebookServiceDep) -> GuidebookOut:
    return service.for_unit(unit_id)

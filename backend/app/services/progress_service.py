"""Learning-progress summary (GET /api/progress)."""

from datetime import timedelta

from app.domain.enums import SkillStatus
from app.models import User
from app.repositories import ContentRepository, XpRepository
from app.schemas.progress import CourseProgressOut, DailyXpOut, ProgressOut
from app.services.context import ServiceContext
from app.services.course_progress import CourseProgressService
from app.services.stats_service import StatsService

_HISTORY_DAYS = 7


class ProgressService:
    def __init__(self, ctx: ServiceContext) -> None:
        self._ctx = ctx
        self._content = ContentRepository(ctx.session)
        self._xp = XpRepository(ctx.session)
        self._course_progress = CourseProgressService(ctx)
        self._stats = StatsService(ctx)

    def summary(self, user: User) -> ProgressOut:
        courses = [self._course_summary(user, course.id) for course in self._content.list_courses()]
        return ProgressOut(
            total_xp=self._stats.total_xp(user),
            daily=self._stats.daily(user),
            streak=self._stats.streak(user),
            lessons_completed=sum(c.lessons_completed for c in courses),
            skills_completed=sum(c.skills_completed for c in courses),
            courses=courses,
            last_7_days=self._history(user),
        )

    def _course_summary(self, user: User, course_id: int) -> CourseProgressOut:
        progress = self._course_progress.load(user.id, course_id)
        total_lessons = sum(len(skill.lessons) for skill in progress.skills)
        completed = sum(progress.lessons_completed(skill) for skill in progress.skills)
        skills_completed = sum(
            1
            for skill in progress.skills
            if progress.skill_status(skill.id) is SkillStatus.COMPLETED
        )
        return CourseProgressOut(
            course_id=course_id,
            lessons_completed=completed,
            total_lessons=total_lessons,
            skills_completed=skills_completed,
            total_skills=len(progress.skills),
            progress=round(completed / total_lessons, 4) if total_lessons else 0.0,
        )

    def _history(self, user: User) -> list[DailyXpOut]:
        today = self._ctx.today()
        first_day = today - timedelta(days=_HISTORY_DAYS - 1)
        by_day = self._xp.xp_by_day(user.id, first_day, today)
        days = (first_day + timedelta(days=offset) for offset in range(_HISTORY_DAYS))
        return [DailyXpOut(date=day, xp=by_day.get(day, 0)) for day in days]

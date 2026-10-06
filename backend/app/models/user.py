"""The learner: identity, preferences and balances that cannot be derived from facts."""

from datetime import date, datetime

from sqlalchemy import CheckConstraint, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base
from app.db.types import UTCDateTime
from app.domain.rules import DAILY_GOAL_OPTIONS, DEFAULT_DAILY_GOAL_XP, MAX_HEARTS

_GOALS = ", ".join(str(goal) for goal in DAILY_GOAL_OPTIONS)


class User(Base):
    """Totals such as XP, daily XP and completed lessons are NOT stored here: they are derived
    from xp_events and progress rows.

    The streak columns are a documented exception (materialised state). They are written only by
    CompletionService via `domain.streak.record_activity`; staleness is handled at read time by
    `domain.streak.displayed_streak`, so reads never mutate them.
    """

    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint(f"hearts BETWEEN 0 AND {MAX_HEARTS}", name="hearts_range"),
        CheckConstraint("gems >= 0", name="gems_non_negative"),
        CheckConstraint(f"daily_goal_xp IN ({_GOALS})", name="daily_goal_option"),
        CheckConstraint("current_streak >= 0", name="streak_non_negative"),
        CheckConstraint("longest_streak >= current_streak", name="longest_gte_current"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(32), unique=True)
    display_name: Mapped[str] = mapped_column(String(64))
    avatar_color: Mapped[str] = mapped_column(String(16))
    is_bot: Mapped[bool] = mapped_column(default=False)
    current_course_id: Mapped[int | None] = mapped_column(
        ForeignKey("courses.id", ondelete="SET NULL")
    )
    daily_goal_xp: Mapped[int] = mapped_column(default=DEFAULT_DAILY_GOAL_XP)

    # Stored count as of `hearts_updated_at`; regeneration is computed from the two (no job).
    hearts: Mapped[int] = mapped_column(default=MAX_HEARTS)
    hearts_updated_at: Mapped[datetime] = mapped_column(UTCDateTime)
    gems: Mapped[int] = mapped_column(default=0)

    current_streak: Mapped[int] = mapped_column(default=0)
    longest_streak: Mapped[int] = mapped_column(default=0)
    last_activity_date: Mapped[date | None]

    created_at: Mapped[datetime] = mapped_column(UTCDateTime)

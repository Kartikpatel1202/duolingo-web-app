"""XP ledger, weekly leaderboard cache and achievements."""

from datetime import date, datetime

from sqlalchemy import CheckConstraint, ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base
from app.db.types import UTCDateTime, str_enum
from app.domain.enums import AchievementMetric, XpSource


class XpEvent(Base):
    """Append-only XP ledger: the single source of truth for total, daily and weekly XP.

    UNIQUE(lesson_attempt_id, source): an attempt can earn each kind of XP at most once.
    `earned_on` is the learning day in APP_TIMEZONE, stored at write time.
    """

    __tablename__ = "xp_events"
    __table_args__ = (
        UniqueConstraint("lesson_attempt_id", "source"),
        CheckConstraint("amount > 0", name="amount_positive"),
        Index("ix_xp_events_user_id_earned_on", "user_id", "earned_on"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    lesson_attempt_id: Mapped[str | None] = mapped_column(
        ForeignKey("lesson_attempts.id", ondelete="CASCADE")
    )
    source: Mapped[XpSource] = mapped_column(str_enum(XpSource, "xp_source"))
    amount: Mapped[int]
    earned_at: Mapped[datetime] = mapped_column(UTCDateTime)
    earned_on: Mapped[date]


class LeaderboardEntry(Base):
    """Weekly league standing: a deliberate cache of SUM(xp_events) for one learner-week.

    Written only by XpService.award(), in the same transaction as the ledger insert.
    `updated_at` records when the learner reached the current total (ranking tie-breaker).
    """

    __tablename__ = "leaderboard_entries"
    __table_args__ = (
        UniqueConstraint("user_id", "week_start"),
        CheckConstraint("xp >= 0", name="xp_non_negative"),
        Index("ix_leaderboard_entries_week_start_xp", "week_start", "xp"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    week_start: Mapped[date]
    xp: Mapped[int] = mapped_column(default=0)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime)


class Achievement(Base):
    """Catalog entry, earned when the learner's `metric >= threshold`."""

    __tablename__ = "achievements"
    __table_args__ = (
        UniqueConstraint("metric", "threshold"),
        CheckConstraint("threshold > 0", name="threshold_positive"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(48), unique=True)
    title: Mapped[str] = mapped_column(String(80))
    description: Mapped[str] = mapped_column(String(255))
    icon: Mapped[str] = mapped_column(String(32))
    metric: Mapped[AchievementMetric] = mapped_column(
        str_enum(AchievementMetric, "achievement_metric")
    )
    threshold: Mapped[int]


class UserAchievement(Base):
    """The fact "learner earned achievement A". Never deleted, never duplicated.

    `lesson_attempt_id` records which completion triggered it, so a repeated (idempotent)
    completion request can report the same new achievements.
    """

    __tablename__ = "user_achievements"
    __table_args__ = (UniqueConstraint("user_id", "achievement_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    achievement_id: Mapped[int] = mapped_column(ForeignKey("achievements.id", ondelete="RESTRICT"))
    lesson_attempt_id: Mapped[str | None] = mapped_column(
        ForeignKey("lesson_attempts.id", ondelete="SET NULL")
    )
    earned_at: Mapped[datetime] = mapped_column(UTCDateTime)

"""Custom column types."""

from datetime import UTC, datetime
from enum import StrEnum

from sqlalchemy import DateTime, Enum
from sqlalchemy.engine import Dialect
from sqlalchemy.types import TypeDecorator


class UTCDateTime(TypeDecorator[datetime]):
    """Stores timezone-aware datetimes as naive UTC and returns them as aware UTC.

    SQLite has no timezone-aware datetime type: without this, values written as aware datetimes
    come back naive, and comparing them with `Clock.now()` would raise.
    """

    impl = DateTime
    cache_ok = True

    def process_bind_param(self, value: datetime | None, dialect: Dialect) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is None:
            raise ValueError("UTCDateTime requires timezone-aware datetimes.")
        return value.astimezone(UTC).replace(tzinfo=None)

    def process_result_value(self, value: datetime | None, dialect: Dialect) -> datetime | None:
        return None if value is None else value.replace(tzinfo=UTC)


def str_enum(enum_cls: type[StrEnum], name: str) -> Enum:
    """A portable string enum column: stores `.value` and adds a CHECK constraint."""
    return Enum(
        enum_cls,
        name=name,
        native_enum=False,
        create_constraint=True,
        length=max(len(member.value) for member in enum_cls),
        values_callable=lambda members: [member.value for member in members],
    )

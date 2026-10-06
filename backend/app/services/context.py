from dataclasses import dataclass
from datetime import date, datetime
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from app.core.clock import Clock, local_date


@dataclass(frozen=True)
class ServiceContext:
    """What every service needs: one DB session (one transaction), the clock and the timezone."""

    session: Session
    clock: Clock
    timezone: ZoneInfo

    def now(self) -> datetime:
        return self.clock.now()

    def today(self) -> date:
        """The current learning day in APP_TIMEZONE."""
        return local_date(self.clock.now(), self.timezone)

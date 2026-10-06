from datetime import UTC, date, datetime, timedelta
from zoneinfo import ZoneInfo

from app.core.clock import local_date
from app.domain.streak import StreakState, displayed_streak, is_active_today, record_activity

TODAY = date(2026, 10, 7)
DAY = timedelta(days=1)


def test_first_activity_starts_a_streak() -> None:
    assert record_activity(StreakState(0, 0, None), TODAY) == StreakState(1, 1, TODAY)


def test_same_day_activity_does_not_change_the_streak() -> None:
    state = StreakState(4, 9, TODAY)
    assert record_activity(state, TODAY) == state


def test_next_day_activity_extends_the_streak() -> None:
    assert record_activity(StreakState(4, 9, TODAY - DAY), TODAY) == StreakState(5, 9, TODAY)


def test_extending_past_longest_updates_longest() -> None:
    assert record_activity(StreakState(9, 9, TODAY - DAY), TODAY) == StreakState(10, 10, TODAY)


def test_missed_day_resets_to_one_and_keeps_longest() -> None:
    assert record_activity(StreakState(6, 12, TODAY - 2 * DAY), TODAY) == StreakState(1, 12, TODAY)


def test_displayed_streak_survives_until_the_end_of_the_next_day() -> None:
    assert displayed_streak(StreakState(6, 6, TODAY), TODAY) == 6
    assert displayed_streak(StreakState(6, 6, TODAY - DAY), TODAY) == 6
    assert displayed_streak(StreakState(6, 6, TODAY - 2 * DAY), TODAY) == 0
    assert displayed_streak(StreakState(0, 0, None), TODAY) == 0


def test_active_today() -> None:
    assert is_active_today(StreakState(1, 1, TODAY), TODAY)
    assert not is_active_today(StreakState(1, 1, TODAY - DAY), TODAY)


def test_learning_day_follows_the_application_timezone() -> None:
    """23:30 UTC on Oct 6 is already Oct 7 in Kolkata (UTC+05:30) but still Oct 6 in New York."""
    instant = datetime(2026, 10, 6, 23, 30, tzinfo=UTC)
    assert local_date(instant, ZoneInfo("UTC")) == date(2026, 10, 6)
    assert local_date(instant, ZoneInfo("Asia/Kolkata")) == date(2026, 10, 7)
    assert local_date(instant, ZoneInfo("America/New_York")) == date(2026, 10, 6)

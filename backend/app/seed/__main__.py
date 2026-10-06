"""Seed command (run from backend/):

python -m app.seed            create tables if needed and seed (idempotent, keeps progress)
python -m app.seed --reset    drop everything, recreate and seed (development only)
python -m app.seed --no-demo  do not play the demo learner's past lessons
"""

import argparse

from app.core.clock import SystemClock
from app.core.config import get_settings
from app.db.database import create_db_engine, create_schema, create_session_factory
from app.seed.seeder import reset_and_seed, seed_database


def main() -> None:
    parser = argparse.ArgumentParser(prog="python -m app.seed", description=__doc__)
    parser.add_argument("--reset", action="store_true", help="drop and recreate all tables first")
    parser.add_argument("--no-demo", action="store_true", help="skip demo learner progress")
    args = parser.parse_args()

    settings = get_settings()
    engine = create_db_engine(settings.database_url)
    factory = create_session_factory(engine)
    clock = SystemClock()
    demo = not args.no_demo

    if args.reset:
        report = reset_and_seed(engine, factory, clock, settings, demo_progress=demo)
    else:
        create_schema(engine)
        report = seed_database(factory, clock, settings, demo_progress=demo)

    print(
        f"Seeded {settings.database_url}: course #{report.course_id}, {report.lessons} lessons, "
        f"{report.exercises} exercises, {report.users} users, "
        f"demo progress {'played' if report.demo_progress_played else 'skipped'}."
    )


if __name__ == "__main__":
    main()

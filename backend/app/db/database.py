"""SQLAlchemy engine/session setup.

SQLite specifics handled here:
* foreign keys are OFF by default in SQLite — enabled on every connection;
* WAL journal mode for file databases (readers don't block the writer);
* in-memory databases use a StaticPool so every session sees the same database.
"""

from collections.abc import Iterator
from pathlib import Path
from typing import Any

from sqlalchemy import MetaData, create_engine, event
from sqlalchemy.engine import Engine, make_url
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import StaticPool

NAMING_CONVENTION = {
    "ix": "ix_%(table_name)s_%(column_0_N_name)s",
    "uq": "uq_%(table_name)s_%(column_0_N_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)


def create_db_engine(database_url: str) -> Engine:
    url = make_url(database_url)
    kwargs: dict[str, Any] = {}
    is_sqlite = url.get_backend_name() == "sqlite"
    in_memory = is_sqlite and url.database in (None, "", ":memory:")

    if is_sqlite:
        kwargs["connect_args"] = {"check_same_thread": False}
        if in_memory:
            kwargs["poolclass"] = StaticPool
        elif url.database:
            Path(url.database).parent.mkdir(parents=True, exist_ok=True)

    engine = create_engine(url, **kwargs)

    if is_sqlite:

        @event.listens_for(engine, "connect")
        def _sqlite_pragmas(dbapi_connection: Any, _: Any) -> None:
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            if not in_memory:
                cursor.execute("PRAGMA journal_mode=WAL")
            cursor.close()

    return engine


def create_session_factory(engine: Engine) -> sessionmaker[Session]:
    return sessionmaker(bind=engine, expire_on_commit=False, autoflush=True)


def create_schema(engine: Engine) -> None:
    import app.models  # noqa: F401  (registers every model on Base.metadata)

    Base.metadata.create_all(engine)


def reset_schema(engine: Engine) -> None:
    import app.models  # noqa: F401

    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)


def session_scope(factory: sessionmaker[Session]) -> Iterator[Session]:
    """Yields a session; rolls back anything left uncommitted (services own their commits)."""
    session = factory()
    try:
        yield session
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

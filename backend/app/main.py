"""Application factory.

uvicorn app.main:app --reload          (from backend/)
"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import api_router
from app.core.clock import Clock, SystemClock
from app.core.config import Settings, get_settings
from app.core.errors import register_error_handlers
from app.db.database import create_db_engine, create_schema, create_session_factory


def create_app(settings: Settings | None = None, clock: Clock | None = None) -> FastAPI:
    settings = settings or get_settings()
    engine = create_db_engine(settings.database_url)

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        create_schema(engine)  # idempotent; seeding is a separate, explicit command
        yield
        engine.dispose()

    app = FastAPI(
        title="Lingo API",
        version="0.1.0",
        summary="Backend for a Duolingo-inspired language-learning app.",
        lifespan=lifespan,
    )
    app.state.settings = settings
    app.state.clock = clock or SystemClock()
    app.state.engine = engine
    app.state.session_factory = create_session_factory(engine)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    register_error_handlers(app)
    app.include_router(api_router)
    if settings.enable_test_routes:
        from app.api.routers import test_support

        app.include_router(test_support.router, prefix="/api")
    return app


app = create_app()

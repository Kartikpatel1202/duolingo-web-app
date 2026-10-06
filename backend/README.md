# Lingo backend

FastAPI + SQLAlchemy + SQLite backend for the Duolingo-inspired learning app.
Architecture and decisions: [`../docs/architecture.md`](../docs/architecture.md).

## Setup (Windows, Python 3.11)

```bash
py -3.11 -m venv .venv
.venv\Scripts\pip install -r requirements-dev.txt
copy .env.example .env            # optional — defaults work for local development
```

## Run

```bash
.venv\Scripts\python -m app.seed --reset    # create data/app.db with content + demo progress
.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
```

* API docs: http://localhost:8000/docs
* Health: http://localhost:8000/api/health

Seed options: `python -m app.seed` (idempotent, keeps progress) · `--reset` (drop + recreate) ·
`--no-demo` (fresh learner).

## Quality checks

```bash
.venv\Scripts\python -m pytest              # unit + integration
.venv\Scripts\ruff check app tests
.venv\Scripts\mypy                           # strict
.venv\Scripts\python -m scripts.export_openapi   # writes ../frontend/openapi.json
```

## Layout

| Package | Responsibility |
|---|---|
| `app/api` | Thin routers, dependencies, OpenAPI error docs |
| `app/schemas` | Pydantic request/response contracts |
| `app/services` | Use-cases; each mutating method is one transaction |
| `app/domain` | Pure rules: hearts, streak, XP, unlocks, leaderboard, achievements, exercise checkers |
| `app/repositories` | Named SQLAlchemy queries per aggregate |
| `app/models` | SQLAlchemy ORM (persistence shape) |
| `app/core` | Config, Clock, error mapping |
| `app/seed` | Deterministic, idempotent seed data |

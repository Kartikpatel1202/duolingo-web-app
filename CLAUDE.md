# Lingo — project guide for coding agents

Duolingo-inspired language-learning app built for an SDE assessment. Read
[`docs/architecture.md`](docs/architecture.md) (design + decisions) and
[`docs/evaluation-checklist.md`](docs/evaluation-checklist.md) (criteria → code → tests) first.

## Rules

- **Never** `git commit`, `git push` or rewrite history — the owner manages Git.
- The FastAPI backend is the source of truth. The frontend never re-implements business rules
  (XP, hearts, streak, unlocks) and never hard-codes learner data or course content.
- Keep the Phase architecture: thin routers → services → pure domain; feature folders on the
  frontend; one typed API client generated from OpenAPI.
- Update the docs in the same change when behaviour or architecture changes.

## Layout

```
backend/   FastAPI + SQLAlchemy + SQLite (Python 3.11, venv in backend/.venv)
frontend/  Next.js 16 + React 19 + Tailwind v4 + TanStack Query + motion
docs/      architecture.md, evaluation-checklist.md, interview-notes.md
```

## Commands

```bash
# backend (from backend/)
.venv\Scripts\python -m app.seed --reset          # demo data
.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
.venv\Scripts\python -m pytest ; .venv\Scripts\ruff check app tests ; .venv\Scripts\mypy
.venv\Scripts\python -m scripts.export_openapi    # refresh frontend/openapi.json

# frontend (from frontend/)
npm run dev            # http://localhost:3000 (expects the API on :8000)
npm run gen:api        # openapi.json → src/lib/api/schema.d.ts (never edit by hand)
npm run typecheck ; npm run lint ; npm run build
npm run test:e2e       # starts its own API (:8001, e2e.db) and Next (:3100)
```

## Frontend conventions

- `components/ui` = generic primitives (no feature or API imports); `features/*` = domain UI;
  `hooks/api` = TanStack Query hooks; `lib/api` = the only HTTP code.
- Colours come from `src/styles/tokens.css` only (Tailwind's default palette is disabled).
- Lesson interaction state (Phase 3) lives in a reducer, not in TanStack Query.

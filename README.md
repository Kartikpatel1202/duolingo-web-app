# Lingo — a Duolingo-style language-learning app

A full-stack learning app built for an SDE assessment: a winding skill path, a lesson player with
five exercise types, and server-authoritative gamification (XP, hearts, streak, gems, quests,
chests, achievements, weekly league, Legendary challenges), plus unit guidebooks with audio.

The implementation, illustrations, icons and course content are original. The layout and
interaction patterns follow the reference product closely.

| | |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript (strict), Tailwind v4, motion, TanStack Query |
| Backend | Python 3.11, FastAPI, SQLAlchemy 2, Pydantic v2, SQLite |
| Contract | OpenAPI exported from FastAPI → generated TypeScript types → typed client |
| Tests | pytest (unit + integration), Playwright (real API + production build, desktop + phone) |

## Run it

Backend (from `backend/`, Python 3.11 with a virtualenv in `.venv`):

```bash
py -3.11 -m venv .venv ; .venv\Scripts\pip install -r requirements-dev.txt
```

```bash
.venv\Scripts\python -m app.seed --reset
```

```bash
.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
```

Frontend (from `frontend/`):

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:3000. API docs are at http://localhost:8000/docs.

### Signing up and in

**GET STARTED** opens the sign-up page: enter an email and a password (8+ characters) twice and you
are signed in and taken to a fresh learning path. **I ALREADY HAVE AN ACCOUNT** logs in with the
same email and password. Accounts live in the `users` table; only a salted hash of the password
is stored.

The seed also creates a learner with some progress, if you want to see a populated app:

| Email | Username | Password |
|---|---|---|
| `alex@example.com` | `learner` | `learn-spanish` |

These are defined in `backend/app/seed/people.py`. Sessions are signed with `SECRET_KEY`
(a development default is used locally; production refuses to start without its own).

## Test it

Backend (from `backend/`):

```bash
.venv\Scripts\python -m pytest
```

```bash
.venv\Scripts\python -m ruff check . ; .venv\Scripts\python -m ruff format --check . ; .venv\Scripts\python -m mypy --strict app tests
```

Frontend (from `frontend/`):

```bash
npm run lint ; npx tsc --noEmit ; npm run build
```

```bash
npx playwright test
```

Playwright starts its own API (port 8001, separate `e2e.db`) and a production Next build (port
3100), resets the database before every test, and fails a test on any uncaught page error.

## The course

Section 1 of a Spanish course: ten units (café, greetings, origins, family, personalities,
things, the city, languages, weather, the market). Each unit has four skills of two lessons, a
treasure chest, a trophy and its own guidebook — 80 lessons and about 500 exercises in all,
seeded by `python -m app.seed --reset`.

## What to look at

| Area | Where |
|---|---|
| Layering: router → service → pure domain → repository | `backend/app/{api,services,domain,repositories}` |
| Schema: content tree, learner facts, ledgers | `backend/app/models`, `docs/architecture.md` §4 |
| Exercise checkers (strategy registry) | `backend/app/domain/exercises` |
| Lesson state machine (pure reducer) | `frontend/src/features/lesson/state/lessonMachine.ts` |
| Learning path geometry and nodes | `frontend/src/features/path` |
| Guidebook (data-driven sections, audio) | `backend/app/models/guidebook.py`, `frontend/src/features/guidebook` |
| Design tokens and dark theme | `frontend/src/styles/tokens.css`, `frontend/src/app/globals.css` |

## Design rules

- **The backend is the source of truth.** Answers are graded on the server and solutions never
  reach the browser; XP, hearts, streak, unlocks, quests and purchases are computed and stored
  server-side. The UI renders what the API returns.
- **Store facts, compute states.** Locked/available/completed are derived from completion rows;
  only real caches (weekly XP, streak counters) are stored, updated in the same transaction.
- **Every reward is idempotent.** Answers, completions, XP events, reward claims and purchases
  each have a unique key, so retries and double-clicks cannot duplicate them.
- **Content is data.** Courses, lessons and guidebooks are seeded into the database and served
  by the API; the frontend hard-codes none of it.

## Mocked on purpose

Email verification, password reset and social login (sign-up and sign-in themselves are real),
Super, friends and friend quests, extra courses and site languages, the chess promo, and practice reminders. They are
labelled as previews in the UI. There is no payment, OAuth or speech-recognition code.

## Branding

The app currently shows placeholder artwork. To install the supplied logo and mascot, copy the
files into `frontend/public/brand/` and fill in `frontend/src/lib/brand.ts` (name, `logoSrc`,
`markSrc`, `mascot` states) — see `frontend/public/brand/README.md`. Every screen renders the
brand through `<BrandLogo>` and `<DuoMascot>`, so nothing else changes.

## Documentation

- [docs/architecture.md](docs/architecture.md) — design, schema, API, decisions and trade-offs
- [docs/evaluation-checklist.md](docs/evaluation-checklist.md) — each criterion → code → test
- [docs/interview-notes.md](docs/interview-notes.md) — demo script and likely questions

# Evaluation checklist

Maps every assessment criterion to **where it is implemented** and **which test proves it**.
Status legend: ☐ planned · ◐ in progress · ☑ done (verified by test). All items are ☐ at the end of Phase 0.

Paths are relative to the repo root. Section links point into [architecture.md](architecture.md).

---

## 1. Functionality

| Requirement | Implementation | Proof (tests) | Status |
|---|---|---|---|
| Learning path renders units → skills with statuses | `CourseService.get_path`, `domain/unlocks.py`, `features/path/*` | `integration/test_path.py`, `unit/test_unlocks.py`, e2e `core-loop` | ☐ |
| Start lesson (attempt created / resumed) | `LessonService.start_attempt`, `POST /lessons/{id}/attempts` | `integration/test_attempts.py`, e2e `refresh-during-lesson` | ☐ |
| Complete lesson loop (path → lesson → feedback → complete → path) | `features/lesson/*`, `CompletionService` | e2e `core-loop` | ☐ |
| 5 exercise types | `domain/exercises/*`, `features/lesson/exercises/*` | `unit/test_checkers_*.py`, e2e `core-loop` (visits every type) | ☐ |
| Immediate feedback (correct / incorrect + solution) | `AnswerService.check`, `FeedbackBar` | `integration/test_check.py`, e2e `core-loop` | ☐ |
| XP awarded once per lesson, perfect bonus | `domain/xp.py`, `XpService`, `xp_events` | `unit/test_xp.py`, `integration/test_complete.py::test_duplicate_completion`, e2e `duplicate-completion` | ☐ |
| Hearts: −1 per wrong, floor 0, regen, refill | `domain/hearts.py`, `HeartsService` | `unit/test_hearts.py`, `integration/test_hearts.py`, e2e `zero-hearts` | ☐ |
| Idempotent answer retry (no double heart loss) | `attempt_answers.UNIQUE(attempt_id, submission_id)` | `integration/test_check.py::test_retry_same_submission` | ☐ |
| Streak (same day / next day / gap) | `domain/streak.py`, `users.current_streak…` | `unit/test_streak.py`, `integration/test_streak_daily.py` | ☐ |
| Daily XP vs daily goal | `xp_events.earned_on`, `ProgressService` | `integration/test_streak_daily.py::test_daily_xp_resets` | ☐ |
| Skill progress + unlock next skill | `user_skill_progress`, `domain/unlocks.py` | `integration/test_progression.py` | ☐ |
| Locked content enforced by server | `403 LESSON_LOCKED` | `integration/test_lessons.py::test_locked`, e2e `locked-skill` | ☐ |
| Progress persists across reloads/restarts | SQLite source of truth | e2e `refresh-during-lesson`, `integration/test_persistence.py` | ☐ |
| Profile with stats & achievements | `ProfileService`, `AchievementService` | `integration/test_profile.py`, e2e `core-loop` | ☐ |
| Weekly leaderboard | `LeaderboardService`, `leaderboard_entries` | `unit/test_leaderboard.py`, `integration/test_leaderboard.py` | ☐ |

## 2. UI/UX

| Requirement | Implementation | Proof | Status |
|---|---|---|---|
| Single design-token source (palette, radius, depth, type) | `styles/tokens.css`, `@theme` in `globals.css` (§11) | review: no raw hex in `features/` | ☐ |
| Tactile 3D buttons (raised / hover lift / pressed / disabled) | `components/ui/Button.tsx` | visual check, e2e screenshots | ☐ |
| Primitives: Button, Card, Modal, Toast, Badge, ProgressRing, StatCard, IconButton, Skeleton, FeedbackBar | `components/ui/*` | used across all features | ☐ |
| Winding path, unit headers, connectors, node states, progress rings, START bubble | `features/path/*`, `pathLayout.ts` | e2e `core-loop`, `locked-skill` | ☐ |
| Lesson layout: exit · progress · hearts / exercise / CTA | `LessonHeader`, `LessonFooter` | e2e | ☐ |
| Feedback as a major state transition (sheet, colour, shake, heart pop) | `FeedbackBar`, `lib/motion.ts` | e2e asserts feedback region role/text | ☐ |
| Celebratory completion screen (XP count-up, stats, achievements) | `LessonComplete` | e2e `core-loop` | ☐ |
| Out-of-hearts modal + refill | `OutOfHeartsModal` | e2e `zero-hearts` | ☐ |
| Responsive 375 / 768 / 1280+ (bottom nav vs rail vs sidebar) | `AppShell`, breakpoint table §2 | Playwright `mobile` + `desktop` projects | ☐ |
| Touch-friendly (≥48px targets, 16px inputs, safe-area) | primitives | mobile project run | ☐ |
| Loading / error / empty states | `Skeleton`, `Toast`, error boundaries | e2e `api-error` | ☐ |
| Reduced motion & keyboard (Enter, 1–9) | `MotionConfig`, `useKeyboardShortcut` | manual + e2e keyboard step | ☐ |

## 3. Database design

| Requirement | Implementation | Proof | Status |
|---|---|---|---|
| Normalised content hierarchy Course → Unit → Skill → Lesson → Exercise | `models/content.py` | `integration/test_db.py::test_schema` | ☐ |
| Learner progress tables with FKs | `models/progress.py`, `models/gamification.py` | `test_db.py` | ☐ |
| Unique constraints (`position` per parent, one completion per lesson, one achievement per user, idempotency keys) | §4 | `test_db.py::test_constraints_reject_duplicates` | ☐ |
| CHECK constraints (hearts 0–5, gems ≥ 0, enums, goal options) | §4 | `test_db.py::test_check_constraints` | ☐ |
| Partial unique index: one active attempt per lesson | `lesson_attempts` | `test_attempts.py::test_resume_not_duplicate` | ☐ |
| FK enforcement on in SQLite | `db/session.py` connect listener | `test_db.py::test_foreign_keys_enabled` | ☐ |
| Cascade / restrict policy | §4 conventions | `test_db.py::test_delete_user_cascades`, `test_delete_lesson_restricted` | ☐ |
| Facts vs derived documented; caches reconciled | §4 source-of-truth table | `test_leaderboard.py::test_entry_matches_ledger` | ☐ |
| Deterministic seed | `seed/run.py`, JSON content validated by checkers | `test_seed.py` | ☐ |

## 4. Backend / API design

| Requirement | Implementation | Proof | Status |
|---|---|---|---|
| Resource-oriented REST endpoints (§5) | `api/routers/*` | integration suite | ☐ |
| Thin routers (call one service) | routers ≤ ~10 lines/handler | code review | ☐ |
| Business logic in services + pure domain | `services/*`, `domain/*` | unit tests run without DB | ☐ |
| Pydantic request/response models; no ORM leakage | `schemas/*` | `test_lessons.py::test_no_solution_leak` | ☐ |
| Consistent error envelope | `core/errors.py` handlers | `test_errors.py` | ☐ |
| Errors documented in OpenAPI | `responses=` on routes | `/docs` review, generated TS | ☐ |
| Injected Clock, no `datetime.now()` in logic | `core/clock.py` | `test_architecture.py::test_no_direct_now` | ☐ |
| Transactions & idempotency | service boundary, `BEGIN IMMEDIATE`, unique keys | `test_complete.py`, `test_check.py` | ☐ |
| Config via env, CORS restricted | `core/config.py`, `.env.example` | review | ☐ |

## 5. Code quality

| Requirement | Implementation | Proof | Status |
|---|---|---|---|
| Typed Python | SQLAlchemy `Mapped[]`, Pydantic, `mypy --strict app/` | mypy passes | ☐ |
| Typed TypeScript | `strict: true`, generated API types, no `any` in features | `tsc --noEmit` passes | ☐ |
| Lint/format | ruff, ESLint (next), Prettier | CI-style `npm run lint`, `ruff check` | ☐ |
| Validation at boundaries | Pydantic request models, checker `validate_answer` | 422 tests | ☐ |
| Error handling end-to-end | `AppError` → envelope → `ApiError` → toast/UI state | e2e `api-error` | ☐ |
| Readable naming, small functions, no dead code | review | — | ☐ |

## 6. Code modularity

| Requirement | Implementation | Proof | Status |
|---|---|---|---|
| Reusable UI primitives | `components/ui` (no feature imports) | used by ≥ 2 features each | ☐ |
| Reusable hooks | `hooks/api/*`, `useLessonSession`, `useKeyboardShortcut` | — | ☐ |
| Feature modules with public `index.ts` | `features/*` | import review | ☐ |
| Extensible exercises (registry both sides) | `domain/exercises/registry.py`, `features/lesson/exercises/registry.ts` | `test_registry.py::test_every_type_registered`; TS exhaustiveness | ☐ |
| Reusable backend services | `XpService` used by completion only path; `HeartsService` by check/refill/user | review | ☐ |
| Lesson state separate from server state | `lessonReducer.ts` vs TanStack Query | (optional) Vitest reducer tests | ☐ |

## 7. Code understanding

| Requirement | Artifact | Status |
|---|---|---|
| Architecture explained | `docs/architecture.md` §1–9 | ☑ (Phase 0) |
| Decision log with trade-offs | `docs/architecture.md` §10 | ☑ (Phase 0) |
| Interview cheat-sheet | `docs/architecture.md` §12 | ☑ (Phase 0) |
| Risk register | `docs/architecture.md` §13 | ☑ (Phase 0) |
| Run/test instructions | `README.md` (Phase 1) | ☐ |
| Docs updated with each phase | this checklist's status column | ☐ |

---

## Phase plan (proposed)

| Phase | Scope | Exit evidence |
|---|---|---|
| 0 | Architecture, contracts, design system, test plan | this document + architecture.md + env templates |
| 1 | Backend foundation: config, clock, DB, models, seed, health/users/courses/path, error envelope, pytest infra | pytest green: db, seed, path, errors |
| 2 | Lesson engine backend: lesson GET, attempts, checkers, check, complete, hearts, XP, streak, unlocks | pytest green: full unit + integration suite for rules |
| 3 | Frontend foundation: Next.js, tokens, primitives, app shell, generated client, path page | path renders from API on 375/768/1280 |
| 4 | Lesson player: reducer, 5 exercise components, feedback, completion, out-of-hearts | e2e `core-loop`, `zero-hearts`, `refresh` |
| 5 | Leaderboard, profile, achievements, polish (motion, a11y), remaining e2e | full Playwright suite green |

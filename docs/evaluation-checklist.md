# Evaluation checklist

Maps every assessment criterion to **where it is implemented** and **which test proves it**.
Status legend: ☐ planned · ◐ backend done, UI pending · ☑ done (verified by test).

Status after **Phase 3 (lesson engine + product experience)**. Paths are relative to the repo root; backend tests live in
`backend/tests/` (`unit/` = pure domain, `integration/` = HTTP through the real app + SQLite).
Section links point into [architecture.md](architecture.md).

---

## 1. Functionality

| Requirement | Implementation | Proof (tests) | Status |
|---|---|---|---|
| Learning path: units → skills with statuses | `CourseService.path`, `services/course_progress.py`, `domain/unlocks.py` | `integration/test_users_courses_path.py`, `unit/test_unlocks.py` | ☑ |
| Start / resume lesson attempt | `LessonService.start_attempt`, `POST /lessons/{id}/attempts` | `integration/test_lessons_and_attempts.py` | ☑ |
| Full lesson loop (start → check → complete) | `AnswerService`, `CompletionService` | `integration/test_completion.py`, `tests/helpers.py::Api.play` | ☑ |
| 5 exercise types | `domain/exercises/*` | `unit/test_checkers.py`, `integration/test_check_answer.py` (every type) | ☑ |
| Immediate feedback (correct / incorrect + solution + note) | `CheckAnswerOut` | `integration/test_check_answer.py` | ☑ |
| XP: 10 first completion, +5 perfect, 0 replay | `domain/xp.py`, `XpService`, `xp_events` | `unit/test_xp_leaderboard_achievements.py`, `integration/test_completion.py` | ☑ |
| Hearts: −1 per wrong, floor 0, regen 30 min, refill 50 gems | `domain/hearts.py`, `HeartsService` | `unit/test_hearts.py`, `integration/test_time_rules.py`, `integration/test_check_answer.py::test_zero_heart_boundary` | ☑ |
| Idempotent answer retry (no double heart loss) | `UNIQUE(attempt_id, submission_id)` | `test_check_answer.py::test_retrying_the_same_submission_does_not_cost_another_heart` | ☑ |
| Idempotent completion | attempt status + 2 unique keys | `test_completion.py::test_duplicate_completion_is_idempotent` | ☑ |
| Streak (same day / next day / gap; read-only decay) | `domain/streak.py` | `unit/test_streak.py`, `test_time_rules.py::test_missed_day_shows_zero_without_mutating…` | ☑ |
| Daily XP vs daily goal | `StatsService.daily` over `xp_events.earned_on` | `test_time_rules.py::test_daily_xp_is_per_learning_day` | ☑ |
| Skill progress + unlock next skill | `user_skill_progress`, `CourseProgress` | `test_completion.py::test_completing_the_last_lesson…`, `test_unlocks_cross_unit_boundaries` | ☑ |
| Locked content enforced by server | `CourseProgressService.require_unlocked_lesson` | `test_lessons_and_attempts.py::test_locked_lesson_is_forbidden`, `test_completion.py::test_cannot_complete_a_locked_lesson` | ☑ |
| Progress persists | SQLite source of truth; resume via attempts | `test_lessons_and_attempts.py::test_resumed_attempt_reports_progress_after_a_refresh` | ☑ |
| Achievements | `AchievementService`, `domain/achievements.py` | `test_time_rules.py::test_profile`, `test_completion.py` | ☑ |
| Weekly leaderboard | `LeaderboardService`, `leaderboard_entries` | `unit/test_xp_leaderboard_achievements.py`, `test_time_rules.py` (week rollover, cache = ledger) | ☑ |
| League: name, zones, top finishes | `domain/leaderboard.league_zone`, `LeaderboardService.top_finishes` | `test_engagement.py::test_leaderboard_has_a_league_with_zones`, `::test_top_finishes…`; e2e `league shows its name, zones…`, `…snooze state` | ☑ |
| Streak screen + freezes (lazy consumption) | `domain/streak.freezes_to_consume`, `StreakService`, `streak_freeze_uses` | `test_engagement_rules.py` (freezes), `test_engagement.py::test_a_streak_freeze_covers_a_missed_day`; e2e `streak screen…` | ☑ |
| Shop (server-side gems, deterministic purchases) | `domain/shop.py`, `ShopService` | `test_engagement.py` (shop tests); e2e `buying a streak freeze…`, `hearts refill is unavailable…` | ☑ |
| Daily quests (derived progress, claim once) | `domain/quests.py`, `QuestService`, `reward_claims` | `test_engagement.py` (quest tests); e2e `a finished lesson completes a daily quest…` | ☑ |
| Unit treasure chests | `RewardService.claim_unit_chest`, `PathUnitOut.chest` | `test_engagement.py::test_unit_chest_unlocks…`; e2e `finishing a unit unlocks its treasure chest…` | ☑ |
| Feed (seeded, deterministic) | `domain/feed.py`, `FeedService` | `test_engagement.py::test_feed_is_built_from_real_data…`; e2e `feed lists seeded activity…` | ☑ |

## 2. UI/UX

| Requirement | Implementation | Proof | Status |
|---|---|---|---|
| Single design-token source (default palette disabled) | `frontend/src/styles/tokens.css` | non-token colours have no utilities; review | ☑ |
| Tactile 3D buttons (raised / hover lift / pressed / disabled / loading without jump) | `tactile` utility, `components/ui/Button.tsx` | visual QA | ☑ |
| Primitives: Button, IconButton, Card, Badge, Pill, Modal, BottomSheet, ProgressRing, ProgressBar, StatCard, Avatar, Skeleton, Toast | `components/ui/*` | used across features | ☑ |
| Winding path, unit banners, connectors, node states, rings, START bubble | `features/path/*`, `pathLayout.ts` | e2e `renders every skill in the state the backend reports` | ☑ |
| Skill dialog: details, progress, lessons, XP, Start / locked explanation | `SkillDetailDialog.tsx` | e2e `an unlocked skill opens…`, `a locked skill explains…` | ☑ |
| Top stats from the API with change animations | `features/stats/*` | e2e `shows the learner's real stats` | ☑ |
| Responsive 375 / 768 / 1024 / 1280+ (bottom nav → rail → sidebar → right rail) | `AppShell` | e2e `mobile.spec.ts` (no overflow, sheet, 48px CTA) + manual QA | ☑ |
| Loading skeletons with no layout shift | `PathSkeleton` (same geometry), stat/dialog skeletons | manual QA | ☑ |
| Friendly error + retry | `ErrorState`, `friendlyError()` | e2e `an API failure shows a friendly error…` | ☑ |
| Accessibility: labelled icon buttons, dialog focus trap, focus rings, headings, reduced motion | primitives, `DialogFrame` | e2e uses roles/names throughout | ☑ |
| Lesson player: header, 5 exercise types, tactile tiles, feedback sheet, heart shake, celebration, out-of-hearts, exit confirm | `features/lesson/*` | `e2e/lesson.spec.ts` (31 tests × 2 viewports) | ☑ |
| Bonus: audio (SpeechSynthesis + fallback) | `hooks/useSpeech.ts`, `components/ui/AudioButton.tsx` | e2e `audio: speaker buttons…` | ☑ |
| Bonus: Legendary challenge (timer, mistake cap, server-validated) | `domain/challenge.py`, `ChallengeStatus` | `test_legendary.py`, e2e `Legendary challenge` | ☑ |
| Bonus: achievement + daily-goal celebration | `celebration/*` | e2e `completing the lesson…` | ☑ |
| Main Learn screen follows the reference: 5-item sidebar + More, chess promo, banner + Guidebook, chest, trophy, Super/League/Quests rail | `components/layout/{SideNav,MoreMenu,ChessPromo,navItems}`, `features/path/{UnitHeader,GuidebookDialog,TrophyNode}`, rail cards | e2e `primary navigation reaches every section`, `the More fly-out…`, `the sidebar promo…`, `the right rail shows…`, `each unit has a banner…` | ☑ |
| Guidebook per unit: key phrases, vocabulary, tips with tables and examples, working audio | `features/guidebook/*`, `AudioButton` (`plain` variant) | `e2e/guidebook.spec.ts` (content from API, one-at-a-time audio, dark mode fit, empty state) | ☑ |
| Motion: breathing current node, hover/press states, chest, trophy, mascot idle; reduced-motion safe | `features/path/*`, `globals.css` keyframes | visual QA at 7 widths; e2e clicks remain stable | ☑ |
| Centralised brand: one config, `BrandLogo` + `DuoMascot` (8 states) on every screen; final artwork pending | `lib/brand.ts`, `components/icons/BrandLogo.tsx`, `components/illustrations/DuoMascot.tsx`, `public/brand/README.md` | e2e `brand and mascot render through the shared components…` | ◐ (assets required) |
| Section 1, Units 1–10 on a data-driven path: unit colours, node kinds, chest, trophy, “Jump here?”, characters, Up next, scroll-to-top | `seed/spanish_course.py`, `features/path/*` | `test_seed_and_database.py::test_seed_shape`, e2e `Section 1 path` (5 tests) | ☑ |
| Entry flow: landing (site language, Login, Get started), onboarding | `features/entry/*` | `e2e/entry.spec.ts` | ☑ |
| Sign up (email + password + confirm), sign in with the same credentials, persisted session, logout, protected routes | `domain/auth.py`, `AuthService.signup/login`, `get_current_user`; `lib/auth/session.ts`, `AuthGate`, `SignupView`, `LoginView` | `integration/test_auth.py`; `e2e/auth.spec.ts` (incl. register → log out → log in) | ☑ |
| Shareable demo link (`/demo`): one click signs in as the seeded learner; off unless `ENABLE_DEMO_LOGIN` is set | `AuthService.demo_login`, `POST /api/auth/demo`; `DemoLoginView`, `useDemoLogin` | `integration/test_auth.py` (demo link); `e2e/auth.spec.ts` (Demo link) | ☑ |
| Bonus: achievement badges (grid, detail dialog, unlock animation) | `features/profile/AchievementGrid.tsx`, `illustrations/Badge.tsx` (`BadgeArt`) | e2e `profile shows overview stats and an achievement detail` | ☑ |
| Bonus: dark mode (light/dark/system, persisted, no flash) | `lib/theme.ts` boot script, `[data-theme=dark]` tokens | e2e `dark mode applies instantly…`, `light mode overrides…` | ☑ |
| Navigation: 5 tabs + More sheet, stat hover cards (streak, XP, gems, hearts), course switcher, reminder banner | `components/layout/*`, `features/stats/*` (`StatPopover`) | e2e `bottom tabs and the More sheet…`, `top bar stats open their cards…`, `reminder banner…` | ☑ |
| Sound effects (recordings in `public/sounds`, Web Audio fallback, toggle) + speaking animation | `lib/sfx.ts`, `AudioButton` | e2e `sound effects can be switched off` | ☑ |
| No horizontal overflow at 375 px on every screen | responsive layouts | e2e `mobile.spec.ts` (7 routes) | ☑ |

## 3. Database design

| Requirement | Implementation | Proof | Status |
|---|---|---|---|
| Normalised content hierarchy Course → Unit → Skill → Lesson → Exercise | `models/content.py` | `integration/test_seed_and_database.py::test_seed_shape` | ☑ |
| Learner facts with FKs (attempts, answers, completions, milestones, XP ledger) | `models/progress.py`, `models/gamification.py` | `test_seed_and_database.py` | ☑ |
| Unique constraints (positions, one completion per lesson, idempotency keys, one achievement) | §4 | `test_positions_are_unique_within_parent`, idempotency tests | ☑ |
| CHECK constraints (hearts 0–5, gems ≥ 0, enums, goal options, xp_reward > 0) | §4 | `test_check_constraints_reject_invalid_state` (6 cases) | ☑ |
| Partial unique index: one active attempt per lesson | `lesson_attempts` | `test_start_attempt_creates_then_resumes` | ☑ |
| FK enforcement on in SQLite | `db/database.py` connect listener | `test_foreign_keys_are_enforced` | ☑ |
| Cascade / restrict policy | §4 conventions | `test_deleting_a_learner_cascades…`, `test_content_with_learner_history_cannot_be_deleted` | ☑ |
| No stored derived state (`is_unlocked` etc.); caches documented & reconciled | §4 source-of-truth table | `test_leaderboard_cache_matches_the_xp_ledger` | ☑ |
| Guidebook content tree with one-per-unit, ordering and cascade rules | `models/guidebook.py` (UNIQUE unit_id, UNIQUE(parent, position), enum CHECKs, CASCADE) | `integration/test_guidebook.py` (8 tests) | ☑ |
| Idempotent gem purchases with a spending ledger | `shop_purchases` UNIQUE(user_id, purchase_id), `ShopService.purchase` | `test_engagement.py::test_a_retried_purchase_is_charged_once`, `::test_a_rejected_purchase_charges_nothing…` | ☑ |
| One-off rewards claimed once | `reward_claims` UNIQUE(user_id, reward_key) | `test_engagement.py::test_claiming_a_quest_once`, `::test_unit_chest_unlocks…` | ☑ |
| Units grouped into sections without a redundant entity | `units.section` + `CHECK (section >= 1)` | `test_seed_shape`, `test_fresh_path_opens_only_the_first_skill_of_each_unit` | ☑ |
| Deterministic, idempotent seed | `seed/*` | `test_seed_is_idempotent`, `test_seed_is_deterministic`, `test_demo_progress_is_played_once` | ☑ |

## 4. Backend / API design

| Requirement | Implementation | Proof | Status |
|---|---|---|---|
| Resource-oriented REST endpoints (§5) | `api/routers/*` | integration suite; `test_openapi_documents_every_endpoint` | ☑ |
| Thin routers (call one service) | every handler is 1–3 lines | `test_routers_do_not_touch_the_database_or_models` | ☑ |
| Business logic in services + pure domain | `services/*`, `domain/*` | `tests/unit` run without DB or HTTP | ☑ |
| Pydantic request/response models; no ORM leakage | `schemas/*` | `test_lesson_response_never_contains_solutions` | ☑ |
| Consistent error envelope, central mapping | `domain/errors.py`, `core/errors.py` | `integration/test_health_and_errors.py` | ☑ |
| Errors documented in OpenAPI | `api/responses.py` | `test_openapi_exposes_discriminated_unions_and_error_schema` | ☑ |
| Injected Clock, no `datetime.now()` in logic | `core/clock.py` | `test_time_is_only_read_through_the_clock` | ☑ |
| Transactions & idempotency | service-owned commits + unique keys | `test_check_answer.py`, `test_completion.py` | ☑ |
| Test-only routes cannot be enabled in production | `Settings._no_test_routes_in_production` | `integration/test_test_routes_guard.py` | ☑ |
| Config via env, CORS restricted | `core/config.py`, `.env.example` | review | ☑ |

## 5. Code quality

| Requirement | Implementation | Proof | Status |
|---|---|---|---|
| Typed Python | SQLAlchemy `Mapped[]`, Pydantic, generics for checkers | `mypy --strict` — 0 issues | ☑ |
| Lint/format | ruff (E, F, I, B, UP, SIM, RUF) + ruff format | `ruff check` — clean | ☑ |
| Validation at boundaries | Pydantic request models + checker `validate_answer` | 422 tests | ☑ |
| Rejected requests have no side effects | validate-then-write in services | `test_answer_of_the_wrong_type_is_invalid_and_free` | ☑ |
| Typed TypeScript | `strict` + `noUncheckedIndexedAccess`, generated API types, no `any` | `npm run typecheck` / `npm run lint` clean | ☑ |

## 6. Code modularity

| Requirement | Implementation | Proof | Status |
|---|---|---|---|
| Extensible exercises (strategy registry) | `domain/exercises/registry.py` | `test_every_exercise_type_has_a_checker`, `test_every_exercise_type_is_in_the_api_unions` | ☑ |
| Reusable backend services | `HeartsService`, `XpService`, `StatsService`, `CourseProgressService` shared by several use-cases | review | ☑ |
| Repositories only for meaningful query groups | 6 repositories, one per aggregate | review | ☑ |
| Reusable UI primitives / hooks / feature modules | `components/ui`, `hooks/api`, `features/*` | review | ☑ |
| Centralised, typed API client | `lib/api/client.ts` (openapi-fetch), `errors.ts`, `queryKeys.ts` | typecheck | ☑ |
| Lesson state separate from server state | `state/lessonMachine.ts` (pure reducer) vs TanStack Query | e2e refresh/retry tests | ☑ |
| Extensible exercise UI | `features/lesson/exercises/registry.tsx` (exhaustive mapped type, no casts) | typecheck | ☑ |

## 7. Code understanding

| Requirement | Artifact | Status |
|---|---|---|
| Architecture explained | `docs/architecture.md` §1–9 | ☑ |
| Decision log with trade-offs | `docs/architecture.md` §10, §14 | ☑ |
| Interview cheat-sheet | `docs/architecture.md` §12, `docs/interview-notes.md` | ☑ |
| Risk register | `docs/architecture.md` §13 | ☑ |
| Run/test instructions | `docs/architecture.md` §14, `backend/README.md` | ☑ |

---

## Phase plan

| Phase | Scope | Status |
|---|---|---|
| 0 | Architecture, contracts, design system, test plan | ☑ |
| 1 | Backend: config, clock, DB, models, seed, all endpoints, rules, 189 pytest tests | ☑ |
| 2 | Frontend foundation: Next.js, tokens, primitives, app shell, generated client, path, stats, leaderboard, profile, settings; 26 Playwright tests | ☑ |
| 3 | Lesson engine, 5 exercise UIs, feedback, completion, hearts/refill, audio, Legendary; 61 Playwright + 199 pytest | ☑ |
| 3+ | Product experience: streak, shop, quests, feed, league, chests, profile badges, dark mode, nav, SFX (§17); 237 pytest + 92 Playwright (desktop + Pixel 7) | ☑ |
| 3 final | Reference-fidelity refinement: sidebar/More, Learn composition, right rail, entry flow, purchase ledger (§18); 240 pytest + 106 Playwright | ☑ |
| 3 polish | Guidebooks (DB + API + page + audio), motion pass, account settings, README (§19); 248 pytest + 116 Playwright | ☑ |
| Auth | Sign-up, login, sessions, protected routes (§21) | ☑ |
| Unit 1 lesson flow | Intro card → START +10 XP → Duo loading screen → first exercise; SKIP, NEW WORD tag, picture cards (§22) | ☑ |
| Unit 1 | Reference-faithful Unit 1 as per-unit configuration (`UNIT_ART`): lime header, coin nodes, extracted Duo/chest/trophy/star artwork, guidebook content (§22) | ☑ |
| Section 1 | Units 1–10: 40 skills, 80 lessons, 507 exercises, 10 guidebooks; full path with jump nodes, characters, section column (§22) | ☑ |
| 4 | Next phase (not started) | ☐ |

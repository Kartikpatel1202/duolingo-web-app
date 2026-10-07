# Interview notes

A walkthrough guide for discussing Lingo: what to show, the decisions behind it, and good answers
to the questions a reviewer is likely to ask. Details live in [architecture.md](architecture.md);
criterion-by-criterion proof lives in [evaluation-checklist.md](evaluation-checklist.md).

---

## 1. Two-minute pitch

Lingo is an original Duolingo-style learning app: Next.js 16 + React 19 frontend, FastAPI +
SQLAlchemy 2 + SQLite backend. A learner walks a winding skill path, plays lessons with five
exercise types, and earns XP, streaks, gems, quests, chests, achievements and a league rank.

The design principle is **the server is the source of truth for everything that matters**:
answers are graded on the server (solutions never reach the browser), rewards are computed
and stored server-side with idempotency keys, and the UI only renders what the API returns.

## 2. Demo script (≈8 minutes)

0. **Entry** (`/`) — landing with site language and two actions: GET STARTED opens sign-up
   (email, password, confirm) and signs you straight into your new, empty path; I ALREADY HAVE AN
   ACCOUNT opens login. Log out from More and log back in with the same credentials.
1a. **Guidebook** — open it from a unit banner; play a phrase; show the tip table. Mention it
   is rows in the database served by the API.
1. **Path** (`/learn`) — unit banners, node states (completed / current / locked), START bubble,
   treasure chest at the end of each unit. Click a locked skill → it explains why.
2. **Lesson** — play one: multiple choice, word bank, match pairs, fill blank, type answer.
   Show a wrong answer (heart shake, solution, sound cue), then the completion screen (XP count-up,
   streak, achievement badge, daily goal).
3. **Refresh mid-lesson** — the attempt resumes where it left off.
4. **Quests** — the "Complete a lesson" quest is now claimable; claim it; gems update in the top bar.
5. **Shop** — buy a streak freeze; show the "Fully equipped" / "Not enough gems" states.
6. **Streak** — calendar with practised days, freezes equipped.
7. **League** — zones, medals, your row highlighted, time left.
8. **Profile** — overview, badge grid → badge detail.
9. **Settings** — switch to dark mode, reload (no flash); turn sounds off.
10. **Phone width** — bottom tabs + More sheet; dialogs become bottom sheets.
11. **Code tour** — router → service → domain → repository; the lesson reducer; the exercise
    registries on both sides.

## 3. Architecture in one picture

```
Browser ── TanStack Query hooks ── openapi-fetch client (types generated from OpenAPI)
                │
FastAPI routers (thin, 1–3 lines) ── services (own the transaction) ── pure domain rules
                                              │
                                     repositories ── SQLAlchemy models ── SQLite
```

* **Routers** parse/validate (Pydantic) and call one service method.
* **Services** orchestrate a use case and commit exactly once.
* **Domain** is pure Python: no DB, no HTTP, no clock. It's where the rules are, so it's
  where most unit tests are.
* **Errors** are typed `DomainError`s mapped centrally to 404/403/409/422 with one envelope
  `{"error": {code, message, details}}`.
* **Time** comes from an injected `Clock` and one `APP_TIMEZONE`, so tests can freeze, advance
  and cross midnight.

## 4. Likely questions and answers

### Data & correctness

**How do you stop a double-click from awarding XP twice?**
Completion is idempotent at three levels: the attempt status (`completed` returns the stored
result), `UNIQUE(user_id, lesson_id)` on lesson completions, and `UNIQUE(attempt_id, source)` on
the XP ledger. The UI only displays the numbers the server returns.

**And a double-click on "claim quest" or "open chest"?**
Every one-off reward is a row in `reward_claims` with `UNIQUE(user_id, reward_key)`
(`quest:daily_lesson:2026-10-07`, `chest:unit:1`). The insert either succeeds or raises
`IntegrityError`, which becomes `409 REWARD_ALREADY_CLAIMED`. No read-then-write race.

**What about a retried answer submission after a network drop?**
The client generates a `submission_id` per answer and reuses it on retry;
`UNIQUE(attempt_id, submission_id)` makes the server return the stored verdict instead of
charging a second heart. An E2E test drops the first response to prove it.

**Why not store quest progress?**
It's derivable. Progress comes from today's completions and XP ledger, so it can't drift, and
"daily reset" is just a different date in the query. Only the claim, a fact, is stored.

**How does the streak work without a cron job?**
Streak state is stored, but *decay is computed on read*: if the last active day was before
yesterday, the displayed streak is 0 (or kept alive by equipped freezes). The next completion
writes the new value and consumes freezes. Reads never mutate.

**Which values are cached, and how do you keep them honest?**
`leaderboard_entries.xp` (weekly XP) and the streak columns on `users`. Both are updated in the
same transaction as the facts that change them, and a test reconciles the leaderboard cache
against the XP ledger.

**Why SQLite?**
Zero setup for reviewers, and the schema uses only portable SQL (FKs enforced, CHECKs, partial
unique index). Moving to Postgres means changing `DATABASE_URL` and adding migrations.

**How do you stop a retried purchase from charging twice?**
The client generates a `purchase_id` per click and reuses it on retries. `shop_purchases` has
`UNIQUE(user_id, purchase_id)`; the service returns the earlier result (`replayed: true`) instead
of charging again, and the gem change, the item and the ledger row commit in one transaction.

**Why is there a `shop_purchases` table if gems are just a balance?**
The balance tells you *how many* gems; the ledger tells you *why*. It gives idempotency, an audit
trail, and the price actually paid (catalogue prices can change).

**Walk me through the tables. Why does each exist?**
Content is a strict hierarchy — course → unit → skill → lesson → exercise — each with a
`position` unique within its parent. Learner data hangs off `users`: `lesson_attempts` (one play
session) → `attempt_answers` (each graded submission, unique per `submission_id`);
`user_lesson_progress` (the fact "completed", unique per lesson) and `user_skill_progress`
(milestone); `xp_events` (the XP ledger — totals, daily and weekly XP are sums of it);
`user_achievements` (earned once); `leaderboard_entries` (weekly cache of the ledger);
`streak_freeze_uses`, `reward_claims`, `shop_purchases` (append-only facts with unique keys).
Deleting a learner cascades to their rows; content that has learner history is `RESTRICT`ed.

**How is the Guidebook stored, and why not just JSON or frontend constants?**
`guidebooks` (one per unit, unique FK) → `guidebook_sections` → `guidebook_entries`, ordered by
`position` and unique within the parent, with constrained `kind` enums and cascade from the unit.
It is course content, so it belongs with the course in the database; rows give ordering and
integrity for free. The frontend maps section kind → component with an exhaustive type, so a new
kind is one enum value and one renderer.

**How does Guidebook audio work, and how do you test it?**
Browser SpeechSynthesis through one `useSpeech` hook and one `AudioButton`. Starting a phrase
cancels the previous one; the button reflects playing state with `aria-pressed`. The E2E test
swaps the speech engine for a recorder and asserts the text, the language and that only one
phrase plays at a time.

**How did you decide what to animate?**
Three tiers: CSS for press/hover feedback, springs for entrances and reactions, and very few
idle loops (current node, START bubble, mascot). Loops rest between cycles, never move a click
target, and all of it respects reduced motion.

**How is ten units of content manageable?**
Lessons are authored as data — four words and three sentences each — and one builder turns every
lesson into the five exercise types, validating each exercise with the checker that will grade it.
Each unit's fourth skill is generated by remixing that unit's own vocabulary. So ten units are
ten blocks of data, not ten implementations, and adding an eleventh is adding data.

**Why is `section` a column on units and not its own table?**
A section has no attributes yet beyond its number, so a table would be an empty entity and an
extra join. The column is constrained (`>= 1`) and can be promoted to a table when sections gain
titles or rules.

**What does “Jump here?” do?**
It marks each unit ahead of the learner and opens a dialog that explains what unlocks it and
takes them to their current lesson. It deliberately unlocks nothing: skipping units would need a
server-side test-out (a new attempt mode and an unlock rule), which is not built.

**Why are `is_locked` / `is_completed` not columns?**
They are derivable from completion rows and positions, and a stored copy could disagree with the
facts. The path endpoint computes them in one pass; only real caches (weekly XP, streak counters)
are stored, and each is updated in the same transaction as the fact that changes it.

### API design

**Why are there separate `check` and `complete` endpoints?**
Different responsibilities: `check` grades one answer and applies heart rules; `complete`
validates the attempt is finished and grants rewards. That keeps each endpoint's transaction
small and each one idempotent on its own key.

**How do you keep solutions secret but still test the UI end-to-end?**
Learner responses never include solutions (a test asserts it). E2E tests read a test-only answer
key from `GET /api/test/lessons/{id}/answer-key`, which is only mounted when
`ENABLE_TEST_ROUTES=true`; it defaults to false, and a test proves production config doesn't
expose it.

**How is the frontend kept in sync with the API?**
OpenAPI is exported from FastAPI, `openapi-typescript` generates types, and `openapi-fetch` gives
a typed client. A backend schema change that breaks the UI fails `tsc`.

### Frontend

**Why a reducer for the lesson?**
The lesson is a sequence of exclusive phases (loading, answering, checking, correct, incorrect,
out of hearts, completing, complete, challenge failed). A pure reducer makes impossible states
unrepresentable and the transitions testable; effects are keyed off the phase.

**How do you add a new exercise type?**
Backend: a checker in the strategy registry (content/solution/answer/reveal models). Frontend: a
component in the exercise registry, an exhaustive mapped type, so TypeScript fails until the new
type is handled. Tests assert every type has a checker and appears in the API unions.

**How does dark mode avoid a flash?**
An inline script in `<head>` reads the stored preference and sets `data-theme` before first
paint. Colours are tokens overridden under `[data-theme="dark"]`, not inverted. `useTheme`
uses `useSyncExternalStore`, so all tabs and OS changes stay in sync.

**Server state vs client state?**
TanStack Query owns server state (user, path, hearts, shop, quests…) and mutations invalidate
`invalidateLearnerState`. Moment-to-moment lesson UI state lives in the reducer. Preferences
(theme, sound, dismissed banner) live in `localStorage` behind `useSyncExternalStore`.

**Why does the sidebar only have five items when the app has more screens?**
The main screen should stay close to the reference and readable at a glance. Navigation is data
(`PRIMARY_ITEMS`, `MORE_ITEMS`), so secondary screens go behind More, the top-bar stats or a
right-rail card. Adding a screen is one line and cannot crowd the Learn page.

**How is branding handled?**
One config file (`lib/brand.ts`) and two components (`BrandLogo`, `DuoMascot` with states). No
screen contains a logo path or the product name, so installing supplied artwork is copying files
and editing one object. The mascot fills a fixed box, so new artwork cannot shift layouts.

**How does authentication work?**
Email and password go to `POST /api/auth/login`; the password is checked against a salted PBKDF2
hash on the user row, and the API returns a signed token (`user id.expiry.HMAC`). The browser
stores it and sends it as a bearer header; `get_current_user()` verifies it on every request.
Because every learner route already depended on that one function, protecting the API was a
one-function change. The signed-in pages sit behind an `AuthGate` that redirects to login, but
the API is the real boundary.

**Why stateless tokens instead of a sessions table?**
No write on login and no extra read per request, and sessions survive restarts. The cost is no
server-side revocation before expiry — logout discards the token in the browser. With more
users or stricter requirements I would add a `sessions` table (revocation, device list) or move
to an HttpOnly cookie on a single domain.

**What is deliberately missing from auth?**
OAuth, email verification, password reset and rate limiting on login and sign-up. Anyone can
register with any address because it is never verified; that is acceptable for this assessment
and is what a verification email would fix. The structure (hashing, tokens, one dependency, 401
category) is what those additions would build on.

**Accessibility?**
Semantic headings and landmarks, labelled icon buttons, dialogs with focus traps, `aria-current`
for the active tab and your leaderboard row, live regions for toasts and feedback, visible focus
rings, 44–48 px touch targets, `prefers-reduced-motion`. The E2E tests locate everything by
role and name, so a missing label fails a test.

### Testing

**What's tested where?**
* pytest unit tests: pure domain rules (streak, freezes, hearts, XP, quests, zones, checkers).
* pytest integration tests: every endpoint through the real app and SQLite, including errors and
  idempotency, with a frozen clock.
* Playwright: real backend + production Next build on separate ports and a separate DB, reset
  before every test, desktop and phone projects; any uncaught page error fails the test.

**How do you avoid flaky E2E tests?**
Deterministic seed + reset per test, one worker (shared DB), role-based locators with web-first
assertions (no sleeps), and the answer key instead of guessing.

### Trade-offs to own

* **Match pairs** are graded as a whole set, because per-tap verdicts would require sending the
  solution to the browser.
* **Legendary timer** is enforced when the next request arrives, not by a background job; good
  enough because a late answer is rejected.
* **Social features** (friends, friend quests) are "Coming soon" placeholders; there's no social
  graph. The feed is honest: built from real league members, your achievements and tips.
* **Single league cohort** ("Silver League"); tier promotion at week end isn't simulated.
* **Notifications** only request permission; nothing is scheduled.
* **Auth** has sign-up and login but no email verification, reset or server-side revocation; **"Jump here?"** placement tests, **Super**
  and the **chess** course are previews, not features.

## 5. If I had more time

1. Alembic migrations + Postgres; Redis-cached leaderboards per league cohort.
2. Real auth (sessions/OAuth); multiple learners and friends; the social graph behind the feed.
3. A week-end job for league promotion/demotion and reminder notifications (Web Push).
4. Spaced-repetition practice built on the answers table (mistakes → review queue).
5. Content in a CMS with authoring validation by the same checker registry.
6. Offline support (PWA cache for the next lesson; queued idempotent submissions replay safely).

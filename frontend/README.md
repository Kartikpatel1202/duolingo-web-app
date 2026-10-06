# Lingo frontend

Next.js (App Router) client for the Lingo API. Architecture: [`../docs/architecture.md`](../docs/architecture.md).

## Run

```bash
npm install
copy .env.example .env.local        # NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev                          # http://localhost:3000 — start the backend first
```

## Scripts

| Script | What it does |
|---|---|
| `npm run gen:api` | Regenerate `src/lib/api/schema.d.ts` from `openapi.json` |
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm run lint` | ESLint (Next core-web-vitals + TypeScript + React Compiler rules) |
| `npm run build` | Production build |
| `npm run test:e2e` | Playwright against the real API (`npx playwright install chromium` once) |

## Structure

```
src/
  app/            routes only: (main)/learn|leaderboard|profile|settings, (lesson)/lesson/[lessonId]
  components/ui   design-system primitives (Button, Modal, BottomSheet, ProgressRing, …)
  components/layout  AppShell, SideNav, BottomNav
  features/       path, stats, leaderboard, profile, settings, lesson
  hooks/api       TanStack Query hooks (useCurrentUser, useCoursePath, …)
  lib/api         typed client, error normalisation, query keys, query client
  styles/tokens.css  colour/type/radius tokens (Tailwind v4 @theme)
e2e/              Playwright specs
```

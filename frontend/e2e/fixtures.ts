import { expect, test as base, type APIRequestContext, type Page } from "@playwright/test";

import type { CoursePath, CurrentUser, SkillDetail } from "../src/types/api";

export const API_URL = "http://localhost:8001";

/** The seeded learner's sign-in (the same values as backend/app/seed/people.py). */
export const LEARNER = { email: "alex@example.com", username: "learner", password: "learn-spanish" };
/** Where the app keeps its session token (src/lib/auth/session.ts). */
export const SESSION_STORAGE_KEY = "lingo-session";

/** Typed reads of the real backend, so assertions compare the UI with live API data. */
export class Backend {
  constructor(private readonly request: APIRequestContext) {}

  /** Fresh database with the seeded demo learner (skill 1 done, skill 2 started, rest locked). */
  async reset(demoProgress = true): Promise<void> {
    const response = await this.request.post(`${API_URL}/api/test/reset`, {
      data: { demo_progress: demoProgress },
    });
    expect(response.status()).toBe(204);
  }

  async me(): Promise<CurrentUser> {
    return (await this.request.get(`${API_URL}/api/users/me`)).json();
  }

  async skill(skillId: number): Promise<SkillDetail> {
    return (await this.request.get(`${API_URL}/api/skills/${skillId}`)).json();
  }

  async path(courseId = 1): Promise<CoursePath> {
    return (await this.request.get(`${API_URL}/api/courses/${courseId}/path`)).json();
  }

  /** Plays a lesson perfectly through the public API, using the test-only answer key. */
  async completeLesson(lessonId: number): Promise<void> {
    const attempt = await this.request.post(`${API_URL}/api/lessons/${lessonId}/attempts`, { data: {} });
    expect(attempt.ok()).toBe(true);
    const { attempt_id } = (await attempt.json()) as { attempt_id: string };
    const key: { exercise_id: number; answer: unknown }[] = await (
      await this.request.get(`${API_URL}/api/test/lessons/${lessonId}/answer-key`)
    ).json();
    for (const [index, entry] of key.entries()) {
      const check = await this.request.post(`${API_URL}/api/lessons/${lessonId}/check`, {
        data: { attempt_id, exercise_id: entry.exercise_id, submission_id: `e2e-${attempt_id}-${index}`, answer: entry.answer },
      });
      expect(check.ok()).toBe(true);
    }
    const complete = await this.request.post(`${API_URL}/api/progress/lesson/${lessonId}/complete`, { data: { attempt_id } });
    expect(complete.ok()).toBe(true);
  }

  /** Completes lessons in path order until the given unit's chest can be opened. */
  async finishUnit(unitIndex = 0): Promise<void> {
    for (let guard = 0; guard < 40; guard += 1) {
      const path = await this.path();
      const unit = path.units[unitIndex];
      if (!unit || unit.chest.status !== "locked") return;
      if (path.current_lesson_id === null) throw new Error("No lesson left to play");
      await this.completeLesson(path.current_lesson_id);
    }
    throw new Error("Unit did not finish within 40 lessons");
  }
}

interface Fixtures {
  /** Start the test signed in as the seeded learner (default). Use `false` to test signing in. */
  authenticated: boolean;
  /** A fresh database, plus the learner's session token when `authenticated`. */
  session: string | null;
  backend: Backend;
  failOnPageErrors: void;
}

export const test = base.extend<Fixtures>({
  authenticated: [true, { option: true }],

  // Every test starts from the same freshly seeded database; signed-in tests then log in through
  // the real endpoint. (Tokens are stateless, so later resets in a test keep the session valid.)
  session: [
    async ({ playwright, authenticated }, provide) => {
      const context = await playwright.request.newContext();
      const reset = await context.post(`${API_URL}/api/test/reset`, { data: { demo_progress: true } });
      expect(reset.status()).toBe(204);
      let token: string | null = null;
      if (authenticated) {
        const login = await context.post(`${API_URL}/api/auth/login`, {
          data: { identifier: LEARNER.email, password: LEARNER.password },
        });
        expect(login.status()).toBe(200);
        token = ((await login.json()) as { token: string }).token;
      }
      await context.dispose();
      await provide(token);
    },
    { auto: true },
  ],

  // API calls made by tests carry the session, exactly like the app's own requests.
  request: async ({ playwright, session }, provide) => {
    const context = await playwright.request.newContext({
      extraHTTPHeaders: session ? { Authorization: `Bearer ${session}` } : {},
    });
    await provide(context);
    await context.dispose();
  },

  // The browser starts with the session already stored, as after a previous visit.
  page: async ({ page, session }, provide) => {
    if (session) {
      await page.addInitScript(
        ([key, token]) => {
          // Only seed it once per browser context, so a test that logs out stays logged out.
          if (window.sessionStorage.getItem("e2e-session-seeded")) return;
          window.sessionStorage.setItem("e2e-session-seeded", "1");
          window.localStorage.setItem(key, token);
        },
        [SESSION_STORAGE_KEY, session] as const,
      );
    }
    await provide(page);
  },

  // Any uncaught exception in the page fails the test — "no runtime errors" is asserted, not hoped.
  failOnPageErrors: [
    async ({ page }, provide) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await provide();
      expect(errors, "uncaught page errors").toEqual([]);
    },
    { auto: true },
  ],
  // (Playwright's fixture callback is named `provide` here so React lint rules don't mistake it
  // for React's `use` hook.)
  backend: async ({ request }, provide) => {
    await provide(new Backend(request));
  },
});

export { expect };

/** The path node for a skill, found by its accessible name ("Snacks, in progress, …"). */
export function skillNode(page: Page, title: string) {
  // Titles such as "How are you?" contain characters that mean something in a regular expression.
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return page.getByRole("button", { name: new RegExp(`^${escaped},`) });
}

import { expect, test as base, type APIRequestContext, type Page } from "@playwright/test";

import type { CoursePath, CurrentUser, SkillDetail } from "../src/types/api";

export const API_URL = "http://localhost:8001";

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
}

export const test = base.extend<{ backend: Backend }>({
  // (Playwright's fixture callback is named `provide` here so React lint rules don't mistake it
  // for React's `use` hook.)
  backend: async ({ request }, provide) => {
    const backend = new Backend(request);
    await backend.reset();
    await provide(backend);
  },
});

export { expect };

/** The path node for a skill, found by its accessible name ("People, in progress, …"). */
export function skillNode(page: Page, title: string) {
  return page.getByRole("button", { name: new RegExp(`^${title},`) });
}

import { expect, skillNode, test } from "./fixtures";
import { LessonDriver } from "./lesson-driver";

// Smallest supported phone width.
test.use({ viewport: { width: 375, height: 812 } });

test.describe("Phone layout", () => {
  test("uses the phone shell without horizontal overflow", async ({ page }) => {
    await page.goto("/learn");
    await expect(skillNode(page, "Drinks")).toBeVisible();

    const nav = page.getByRole("navigation", { name: "Primary" });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link")).toHaveCount(5);
    await expect(nav.getByRole("button", { name: "More" })).toBeVisible();
    await expect(page.getByRole("group", { name: "Your stats" })).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("bottom tabs and the More sheet reach every section", async ({ page }) => {
    await page.goto("/learn");
    const nav = page.getByRole("navigation", { name: "Primary" });
    for (const [label, url] of [
      ["Leaderboards", /\/leaderboard$/],
      ["Quests", /\/quests$/],
      ["Shop", /\/shop$/],
      ["Profile", /\/profile$/],
      ["Learn", /\/learn$/],
    ] as const) {
      await nav.getByRole("link", { name: label }).click();
      await expect(page).toHaveURL(url);
      await expect(nav.getByRole("link", { name: label })).toHaveAttribute("aria-current", "page");
    }

    for (const [label, url] of [
      ["Feed", /\/feed$/],
      ["Streak", /\/streak$/],
      ["Settings", /\/settings$/],
    ] as const) {
      await nav.getByRole("button", { name: "More" }).click();
      const sheet = page.getByRole("dialog", { name: "More" });
      await sheet.getByRole("link", { name: label }).click();
      await expect(page).toHaveURL(url);
      await expect(sheet).toBeHidden();
    }
  });

  for (const route of ["/streak", "/shop", "/quests", "/feed", "/leaderboard", "/profile", "/settings"]) {
    test(`${route} fits a phone without horizontal overflow`, async ({ page }) => {
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test("a locked skill opens a bottom sheet with a reachable button", async ({ page }) => {
    await page.goto("/learn");
    await skillNode(page, "Ordering").click();

    const sheet = page.getByRole("dialog", { name: "Ordering" });
    await expect(sheet).toBeVisible();
    // The sheet slides up; wait until it rests against the bottom edge of the screen.
    await expect
      .poll(async () => {
        const box = await sheet.boundingBox();
        return box ? Math.round(box.y + box.height) : null;
      })
      .toBe(812);

    const start = sheet.getByRole("button", { name: "Locked" });
    await expect(start).toBeInViewport();
    const startBox = await start.boundingBox();
    expect(startBox?.height ?? 0).toBeGreaterThanOrEqual(48); // comfortable touch target
  });

  test("the lesson player fits a phone: big targets, reachable actions, no overflow", async ({ page, request, backend }) => {
    const lesson = await LessonDriver.open(page, request, (await backend.path()).current_lesson_id!);
    const exercise = await lesson.current();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    for (const target of await lesson.exerciseContainer.getByRole("button").all()) {
      expect((await target.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
    }

    await lesson.enter(exercise, lesson.correctAnswer(exercise));
    await expect(lesson.checkButton).toBeInViewport();
    await lesson.checkButton.click();
    await expect(lesson.continueButton).toBeInViewport();
    expect((await lesson.continueButton.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(48);
  });
});

test.describe("Unit 1 lesson flow on a phone", () => {
  test("the intro card, loading screen and first exercise fit the screen", async ({ page, backend }) => {
    await backend.reset(false);
    await page.goto("/learn");
    await skillNode(page, "Drinks").click();

    const intro = page.getByRole("dialog", { name: /^Drinks/ });
    const start = intro.getByRole("button", { name: "Start +10 XP" });
    await expect(start).toBeInViewport();
    expect((await start.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(48);
    const overflow = () =>
      page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(await overflow()).toBeLessThanOrEqual(0);

    await start.click();
    await expect(page.getByLabel("Loading lesson")).toBeVisible();
    expect(await overflow()).toBeLessThanOrEqual(0);

    await expect(page.locator("[data-exercise-id]")).toBeVisible();
    expect(await overflow()).toBeLessThanOrEqual(0);
    await expect(page.getByRole("button", { name: "Skip" })).toBeInViewport();
    await expect(page.getByRole("button", { name: "Check" })).toBeInViewport();
    for (const card of await page.locator("[data-option-id]").all()) {
      const box = (await card.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(375);
    }
  });
});

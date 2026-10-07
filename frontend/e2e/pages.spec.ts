import { API_URL, expect, test } from "./fixtures";

import type { Leaderboard } from "../src/types/api";

test.describe("League, profile and settings", () => {
  test("league shows its name, zones and the learner highlighted", async ({ page, request, backend }) => {
    const me = await backend.me();
    const league: Leaderboard = await (await request.get(`${API_URL}/api/leaderboard`)).json();
    await page.goto("/leaderboard");

    await expect(page.getByRole("heading", { level: 1, name: league.league.name })).toBeVisible();
    await expect(page.getByText(/left · you're #\d+/)).toBeVisible();
    const board = page.getByRole("list", { name: "Leaderboard" });
    // Zone dividers are decorative list items; competitors are the rows.
    await expect(board.locator("li:not([aria-hidden])")).toHaveCount(league.entries.length);
    await expect(board.locator('[aria-current="true"]')).toContainText(me.display_name);
    await expect(board.getByText("Promotion zone")).toBeVisible();
    await expect(board.getByText("Demotion zone")).toBeVisible();
  });

  test("a learner without XP this week sees the snooze state", async ({ page, backend }) => {
    await backend.reset(false);
    await page.goto("/leaderboard");
    await expect(page.getByText("Don't snooze! Do a lesson to start competing this week.")).toBeVisible();
    await page.getByRole("link", { name: "Start a lesson" }).click();
    await expect(page).toHaveURL(/\/learn$/);
  });

  test("profile shows overview stats and an achievement detail", async ({ page, backend }) => {
    const me = await backend.me();
    await page.goto("/profile");

    await expect(page.getByRole("heading", { level: 1, name: me.display_name })).toBeVisible();
    await expect(page.getByText(`@${me.username}`)).toBeVisible();
    await expect(page.getByText("Total XP")).toBeVisible();
    await expect(page.getByText("Top 3 finishes")).toBeVisible();
    await expect(page.getByRole("link", { name: "Settings" }).first()).toBeVisible();

    const badges = page.getByRole("list", { name: "Achievements" });
    await badges.getByRole("button", { name: /^First Steps/ }).click();
    const detail = page.getByRole("dialog", { name: "First Steps" });
    await expect(detail).toBeVisible();
    await expect(detail.getByRole("progressbar")).toBeVisible();
  });

  test("changing the daily goal is saved to the backend", async ({ page, backend }) => {
    await page.goto("/settings");

    await page.getByRole("radio", { name: /Serious/ }).click();
    await expect(page.getByRole("status").getByText("Daily goal set to 30 XP")).toBeVisible();
    await expect(page.getByRole("radio", { name: /Serious/ })).toHaveAttribute("aria-checked", "true");
    expect((await backend.me()).daily.daily_goal).toBe(30);
  });

  test("dark mode applies instantly and survives a reload", async ({ page }) => {
    await page.goto("/settings");
    const html = page.locator("html");

    await page.getByRole("radio", { name: "Dark" }).click();
    await expect(html).toHaveAttribute("data-theme", "dark");
    const surface = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(surface).toBe("rgb(19, 31, 36)");

    await page.reload();
    await expect(html).toHaveAttribute("data-theme", "dark");
    await expect(page.getByRole("radio", { name: "Dark" })).toHaveAttribute("aria-checked", "true");
  });

  test("light mode overrides a dark system preference", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/settings");
    const html = page.locator("html");
    // Default preference is "system", so the dark OS setting wins at first.
    await expect(html).toHaveAttribute("data-theme", "dark");

    await page.getByRole("radio", { name: "Light" }).click();
    await expect(html).toHaveAttribute("data-theme", "light");
    await page.reload();
    await expect(html).toHaveAttribute("data-theme", "light");
  });

  test("settings show the account and course from the API", async ({ page, backend }) => {
    const me = await backend.me();
    const path = await backend.path();
    await page.goto("/settings");
    const account = page.getByRole("region", { name: "Account" });
    await expect(account).toContainText(`@${me.username}`);
    await expect(account).toContainText(path.course.title);
    await account.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("sound effects can be switched off", async ({ page }) => {
    await page.goto("/settings");
    const sound = page.getByRole("switch", { name: "Sound effects" });
    await expect(sound).toHaveAttribute("aria-checked", "true");
    await sound.click();
    await expect(sound).toHaveAttribute("aria-checked", "false");
    await page.reload();
    await expect(page.getByRole("switch", { name: "Sound effects" })).toHaveAttribute("aria-checked", "false");
  });

  test("primary navigation reaches every section", async ({ page, isMobile }) => {
    test.skip(isMobile, "Phones use the bottom tab bar + More sheet (mobile.spec.ts)");
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
    // The primary list stays short: exactly the five core destinations plus More.
    await expect(nav.getByRole("link")).toHaveCount(5);

    // Secondary destinations live in the More fly-out.
    for (const [label, url] of [
      ["Feed", /\/feed$/],
      ["Streak", /\/streak$/],
      ["Settings", /\/settings$/],
    ] as const) {
      const more = nav.getByRole("button", { name: "More" });
      await more.click();
      await expect(more).toHaveAttribute("aria-expanded", "true");
      await nav.getByRole("link", { name: label }).click();
      await expect(page).toHaveURL(url);
      await expect(more).toHaveAttribute("aria-expanded", "false");
    }
  });

  test("the More fly-out closes with Escape and returns focus", async ({ page, isMobile }) => {
    test.skip(isMobile, "Phones use a bottom sheet (mobile.spec.ts)");
    await page.goto("/learn");
    const more = page.getByRole("navigation", { name: "Primary" }).getByRole("button", { name: "More" });
    await more.click();
    await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Log out" })).toBeHidden();
    await expect(more).toBeFocused();
  });

  test("the sidebar promo opens an honest coming-soon dialog", async ({ page, isMobile }) => {
    test.skip(isMobile, "The promo card is part of the desktop sidebar");
    await page.goto("/learn");
    await expect(page.getByRole("heading", { name: "Want to learn chess?" })).toBeVisible();
    await page.getByRole("button", { name: "Try chess" }).click();
    const dialog = page.getByRole("dialog", { name: "Chess is coming soon" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Got it" }).click();
    await expect(dialog).toBeHidden();
  });

  test("the right rail shows Super, league, quests and course progress from the API", async ({ page, backend, isMobile }) => {
    test.skip(isMobile, "The right rail exists from 1280px");
    const path = await backend.path();
    await page.goto("/learn");
    await expect(page.getByRole("heading", { name: "Try Super for free" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Daily Quests" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Daily Quests" }).getByRole("listitem")).toHaveCount(3);
    await expect(page.getByRole("region", { name: path.course.title })).toContainText("lessons");
    await page.getByRole("link", { name: "View league" }).click();
    await expect(page).toHaveURL(/\/leaderboard$/);
  });

  test("top bar stats link to their screens", async ({ page }) => {
    await page.goto("/learn");
    const stats = page.getByRole("group", { name: "Your stats" }).first();
    await stats.getByRole("link", { name: /streak/ }).click();
    await expect(page).toHaveURL(/\/streak$/);
    await page.getByRole("group", { name: "Your stats" }).first().getByRole("link", { name: /gems/ }).click();
    await expect(page).toHaveURL(/\/shop$/);
    await page.getByRole("group", { name: "Your stats" }).first().getByRole("button", { name: /hearts/ }).click();
    await expect(page.getByRole("dialog", { name: /hearts/i })).toBeVisible();
  });
});

import { expect, test } from "./fixtures";

test.describe("Leaderboard, profile and settings", () => {
  test("leaderboard lists the league with the learner highlighted", async ({ page, backend }) => {
    const me = await backend.me();
    await page.goto("/leaderboard");

    await expect(page.getByRole("heading", { level: 1, name: "Weekly league" })).toBeVisible();
    const board = page.getByRole("list", { name: "Leaderboard" });
    await expect(board.getByRole("listitem")).toHaveCount(10);
    await expect(board.locator('[aria-current="true"]')).toContainText(me.display_name);
  });

  test("profile shows the learner's stats and achievements", async ({ page, backend }) => {
    const me = await backend.me();
    await page.goto("/profile");

    await expect(page.getByRole("heading", { level: 1, name: me.display_name })).toBeVisible();
    await expect(page.getByText("Total XP")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Achievements" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "First Steps" })).toBeVisible();
  });

  test("changing the daily goal is saved to the backend", async ({ page, backend }) => {
    await page.goto("/settings");

    await page.getByRole("radio", { name: /Serious/ }).click();
    await expect(page.getByRole("status").getByText("Daily goal set to 30 XP")).toBeVisible();
    await expect(page.getByRole("radio", { name: /Serious/ })).toHaveAttribute("aria-checked", "true");
    expect((await backend.me()).daily.daily_goal).toBe(30);
  });

  test("primary navigation reaches every section", async ({ page }) => {
    await page.goto("/learn");
    const nav = page.getByRole("navigation", { name: "Primary" });
    for (const [label, url] of [
      ["Leaderboard", /\/leaderboard$/],
      ["Profile", /\/profile$/],
      ["Settings", /\/settings$/],
      ["Learn", /\/learn$/],
    ] as const) {
      await nav.getByRole("link", { name: label }).click();
      await expect(page).toHaveURL(url);
    }
  });
});

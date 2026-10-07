import { API_URL, expect, test } from "./fixtures";

import type { Quests, Shop, StreakCalendar } from "../src/types/api";

test.describe("Streak, shop, quests, feed and chests", () => {
  test("streak screen shows the backend streak and a navigable calendar", async ({ page, request }) => {
    const streak: StreakCalendar = await (await request.get(`${API_URL}/api/streak`)).json();
    await page.goto("/streak");

    const hero = page.getByRole("region", { name: "Current streak" });
    await expect(hero.getByRole("heading", { level: 1, name: "day streak!" })).toBeVisible();
    await expect(hero).toContainText(String(streak.current));

    const calendar = page.getByRole("list", { name: "Streak calendar" });
    await expect(calendar).toBeVisible();
    await expect(calendar.locator('[aria-label$=": practiced"]')).toHaveCount(streak.practiced_days.length);

    await expect(page.getByRole("button", { name: "Next month" })).toBeDisabled();
    await page.getByRole("button", { name: "Previous month" }).click();
    await expect(page.getByRole("button", { name: "Next month" })).toBeEnabled();

    await page.getByRole("tab", { name: "Friends" }).click();
    await expect(page.getByText("Friend streaks are coming soon")).toBeVisible();
  });

  test("buying a streak freeze spends gems on the server and equips it", async ({ page, request, backend }) => {
    const before = await backend.me();
    await page.goto("/shop");
    await expect(page.getByRole("heading", { level: 1, name: "Shop" })).toBeVisible();

    const freeze = page.locator('[data-shop-item="streak_freeze"]');
    await freeze.getByRole("button", { name: "Buy Streak Freeze for 100 gems" }).click();
    await expect(page.getByRole("status").getByText("Streak Freeze purchased!")).toBeVisible();

    const shop: Shop = await (await request.get(`${API_URL}/api/shop`)).json();
    expect(shop.gems).toBe(before.gems - 100);
    expect(shop.items.find((item) => item.id === "streak_freeze")?.owned).toBe(1);

    await page.goto("/streak");
    await expect(page.getByRole("region", { name: "Streak freezes" })).toContainText("1 of 2 streak freezes equipped");
  });

  test("hearts refill is unavailable while hearts are full", async ({ page }) => {
    await page.goto("/shop");
    const refill = page.locator('[data-shop-item="heart_refill"]');
    await expect(refill.getByRole("button")).toBeDisabled();
    await expect(refill).toContainText("Hearts are full");
  });

  test("a finished lesson completes a daily quest whose reward is claimed once", async ({ page, request, backend }) => {
    await backend.completeLesson((await backend.path()).current_lesson_id!);
    const before = await backend.me();
    await page.goto("/quests");

    const quest = page.locator('[data-quest="daily_lesson"]');
    await quest.getByRole("button", { name: "Claim Complete your next lesson reward" }).click();
    await expect(page.getByRole("status").getByText("+10 gems!")).toBeVisible();
    await expect(quest.getByRole("img", { name: "Reward claimed" })).toBeVisible();

    expect((await backend.me()).gems).toBe(before.gems + 10);
    const quests: Quests = await (await request.get(`${API_URL}/api/quests`)).json();
    expect(quests.quests.find((q) => q.code === "daily_lesson")?.claimed).toBe(true);
    // Claiming again is rejected by the server.
    const again = await request.post(`${API_URL}/api/quests/daily_lesson/claim`);
    expect(again.status()).toBe(409);
  });

  test("feed lists seeded activity and friend placeholders", async ({ page }) => {
    await page.goto("/feed");
    await expect(page.getByRole("heading", { level: 1, name: "Feed" })).toBeVisible();
    const activity = page.getByRole("list", { name: "Activity" });
    await expect(activity.getByRole("listitem").first()).toBeVisible();
    expect(await activity.getByRole("listitem").count()).toBeGreaterThanOrEqual(3);
    await expect(page.getByRole("region", { name: "Friend streaks" })).toBeVisible();
  });

  test("finishing a unit unlocks its treasure chest, which pays out once", async ({ page, backend }) => {
    test.setTimeout(90_000);
    await backend.finishUnit(0);
    const before = await backend.me();
    await page.goto("/learn");

    await page.getByRole("button", { name: "Open treasure chest (+20 gems)" }).click();
    await expect(page.getByRole("status").getByText(/20 gems/)).toBeVisible();
    await expect(page.getByRole("img", { name: /chest.*opened/i }).first()).toBeVisible();
    expect((await backend.me()).gems).toBe(before.gems + 20);
  });

  test("the reminder banner stays dismissed after a reload", async ({ page }) => {
    await page.goto("/learn");
    const banner = page.getByRole("complementary", { name: "Practice reminders" });
    await expect(banner).toBeVisible();
    await banner.getByRole("button", { name: "Dismiss reminders" }).click();
    await expect(banner).toBeHidden();
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await expect(page.getByRole("complementary", { name: "Practice reminders" })).toBeHidden();
  });
});

import type { Page } from "@playwright/test";

import { SESSION_STORAGE_KEY, expect, test } from "./fixtures";

/** Open the landing page as a visitor without a session (with one it redirects to the path). */
async function openLandingSignedOut(page: Page) {
  await page.addInitScript((key) => window.localStorage.removeItem(key), SESSION_STORAGE_KEY);
  await page.goto("/");
}

test.describe("Entry: landing, login and get started", () => {
  test("landing offers a site language, login and get started", async ({ page }) => {
    await openLandingSignedOut(page);

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: "The most fun way to learn languages, chess, and more!" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /^Site language/ })).toBeVisible();
    await expect(page.getByRole("main").getByRole("link", { name: "Get started" })).toHaveAttribute("href", "/welcome");
    await expect(page.getByRole("main").getByRole("link", { name: "I already have an account" })).toHaveAttribute(
      "href",
      "/login",
    );
    // Only the reference's elements: no extra sections below the hero.
    await expect(page.getByRole("heading")).toHaveCount(1);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("the landing page is white even when the learner chose dark mode", async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem("lingo-theme", "dark"));
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe("rgb(255, 255, 255)");

    // The rest of the app still honours the dark preference.
    await page.goto("/login");
    await expect(page.getByRole("heading", { level: 1, name: "Log in" })).toBeVisible();
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe("rgb(19, 31, 36)");
  });

  test("brand and mascot render through the shared components with no failed asset requests", async ({ page }) => {
    const failed: string[] = [];
    page.on("response", (response) => {
      if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`);
    });

    await page.goto("/");
    await expect(page.getByRole("banner").getByRole("link", { name: /home$/ })).toBeVisible();
    await expect(page.getByRole("main").locator("img").first()).toBeVisible();

    await page.goto("/learn");
    await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
    await expect(page.locator("[data-mascot]").first()).toBeAttached();

    expect(failed.filter((entry) => entry.includes("/brand/"))).toEqual([]);
    expect(failed).toEqual([]);
  });

  test("a signed-in visitor is sent from the landing page to their path", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/learn$/);
  });

  test("the course strip offers Spanish and shows other languages as disabled previews", async ({ page }) => {
    await openLandingSignedOut(page);
    const strip = page.getByRole("navigation", { name: "Courses" });
    // Spanish is the only real course, so it is the only link.
    await expect(strip.getByRole("link")).toHaveCount(1);
    for (const preview of ["English", "Chess", "Math", "French", "German", "Italian", "Portuguese"]) {
      await expect(strip.locator('[aria-disabled="true"]').filter({ hasText: preview })).toHaveCount(1);
    }
    await strip.getByRole("link", { name: "Spanish" }).click();
    await expect(page).toHaveURL(/\/welcome$/);
  });

  test("site language lists English and marks the rest as upcoming", async ({ page }) => {
    await openLandingSignedOut(page);
    const trigger = page.getByRole("button", { name: /^Site language/ });
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    const languages = page.getByRole("list", { name: "Site language" });
    // English is the only selectable language; the rest are previews.
    await expect(languages.getByRole("button")).toHaveCount(1);
    await expect(languages.getByRole("button", { name: "English" })).toHaveAttribute("aria-current", "true");
    await expect(languages.locator('[aria-disabled="true"]').filter({ hasText: "Español" })).toHaveCount(1);

    await page.keyboard.press("Escape");
    await expect(languages).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("log out returns to the landing page", async ({ page, isMobile }) => {
    await page.goto("/learn");
    const nav = page.getByRole("navigation", { name: "Primary" });
    await nav.getByRole("button", { name: "More" }).click();
    const scope = isMobile ? page.getByRole("dialog", { name: "More" }) : nav;
    await scope.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("main").getByRole("link", { name: "Get started" })).toBeVisible();
  });
});

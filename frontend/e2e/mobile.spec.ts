import { expect, skillNode, test } from "./fixtures";

// Smallest supported phone width.
test.use({ viewport: { width: 375, height: 812 } });

test.describe("Phone layout", () => {
  test("uses the phone shell without horizontal overflow", async ({ page }) => {
    await page.goto("/learn");
    await expect(skillNode(page, "Greetings")).toBeVisible();

    const nav = page.getByRole("navigation", { name: "Primary" });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link")).toHaveCount(4);
    await expect(page.getByRole("group", { name: "Your stats" })).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("skill details open as a bottom sheet with a reachable CTA", async ({ page }) => {
    await page.goto("/learn");
    await skillNode(page, "People").click();

    const sheet = page.getByRole("dialog", { name: "People" });
    await expect(sheet).toBeVisible();
    // The sheet slides up; wait until it rests against the bottom edge of the screen.
    await expect
      .poll(async () => {
        const box = await sheet.boundingBox();
        return box ? Math.round(box.y + box.height) : null;
      })
      .toBe(812);

    const start = sheet.getByRole("button", { name: "Start lesson" });
    await expect(start).toBeInViewport();
    const startBox = await start.boundingBox();
    expect(startBox?.height ?? 0).toBeGreaterThanOrEqual(48); // comfortable touch target
  });
});

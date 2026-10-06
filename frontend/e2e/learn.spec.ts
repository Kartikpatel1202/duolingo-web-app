import { expect, skillNode, test } from "./fixtures";

test.describe("Learn page", () => {
  test("loads the course and learning path from the backend", async ({ page, backend }) => {
    const path = await backend.path();
    await page.goto("/");

    await expect(page).toHaveURL(/\/learn$/);
    await expect(page.getByRole("heading", { level: 1, name: path.course.title })).toBeVisible();
    for (const unit of path.units) {
      await expect(page.getByRole("heading", { level: 2, name: unit.description ?? unit.title })).toBeVisible();
    }
    const allSkills = path.units.flatMap((unit) => unit.skills);
    await expect(page.locator("button[data-status]")).toHaveCount(allSkills.length);
  });

  test("shows the learner's real stats in the top bar", async ({ page, backend }) => {
    const me = await backend.me();
    await page.goto("/learn");

    const stats = page.getByRole("group", { name: "Your stats" });
    await expect(stats.getByRole("img", { name: `${me.total_xp} total XP` })).toBeVisible();
    await expect(stats.getByRole("img", { name: `${me.gems} gems` })).toBeVisible();
    await expect(
      stats.getByRole("img", { name: `${me.hearts.current} of ${me.hearts.max} hearts` }),
    ).toBeVisible();
    await expect(stats.getByRole("img", { name: new RegExp(`^${me.streak.current} days? streak$`) })).toBeVisible();
  });

  test("renders every skill in the state the backend reports", async ({ page, backend }) => {
    const skills = (await backend.path()).units.flatMap((unit) => unit.skills);
    await page.goto("/learn");

    for (const skill of skills) {
      await expect(skillNode(page, skill.title)).toHaveAttribute("data-status", skill.status);
    }
    // The demo learner has every state on screen at once.
    expect(new Set(skills.map((skill) => skill.status))).toEqual(
      new Set(["completed", "in_progress", "locked"]),
    );
    await expect(skillNode(page, "Food")).toHaveAccessibleName(/locked/);
  });

  test("an unlocked skill opens its details with a Start lesson action", async ({ page, backend }) => {
    const people = (await backend.path()).units[0]!.skills.find((skill) => skill.title === "People")!;
    await page.goto("/learn");

    await skillNode(page, "People").click();
    const dialog = page.getByRole("dialog", { name: "People" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("In progress")).toBeVisible();
    await expect(dialog.getByText(`${people.lessons_completed} / ${people.total_lessons} lessons`)).toBeVisible();
    await expect(dialog.getByText("+10 XP")).toBeVisible();

    await dialog.getByRole("button", { name: "Start lesson" }).click();
    await expect(page).toHaveURL(new RegExp(`/lesson/${people.next_lesson_id}$`));
    await expect(page.getByRole("heading", { level: 1, name: "Family" })).toBeVisible();
  });

  test("a locked skill explains how to unlock it and cannot be started", async ({ page }) => {
    await page.goto("/learn");

    await skillNode(page, "Food").click();
    const dialog = page.getByRole("dialog", { name: "Food" });
    await expect(dialog.getByText("Complete “People” to unlock this skill.")).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Locked" })).toBeDisabled();
    await expect(dialog.getByRole("button", { name: "Start lesson" })).toHaveCount(0);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("Continue in the course header opens the current skill", async ({ page }) => {
    await page.goto("/learn");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("dialog", { name: "People" })).toBeVisible();
  });

  test("an API failure shows a friendly error and Try again recovers", async ({ page }) => {
    let failing = true;
    await page.route("**/api/courses/1/path", (route) =>
      failing
        ? route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ error: { code: "INTERNAL_ERROR", message: "boom", details: {} } }),
          })
        : route.continue(),
    );
    await page.goto("/learn");

    // (Next.js also renders an empty role="alert" route announcer, so filter by content.)
    const alert = page.getByRole("alert").filter({ hasText: "Something went wrong" });
    await expect(alert).toBeVisible({ timeout: 20_000 });
    await expect(alert).not.toContainText("boom");
    await expect(alert).not.toContainText("500");

    failing = false;
    await alert.getByRole("button", { name: "Try again" }).click();
    await expect(skillNode(page, "Greetings")).toBeVisible();
  });

  test("a locked lesson URL is refused by the backend", async ({ page, backend }) => {
    const locked = (await backend.path()).units[2]!.skills[0]!;
    expect(locked.status).toBe("locked");
    const lessonId = (await backend.skill(locked.id)).lessons[0]!.id;
    await page.goto(`/lesson/${lessonId}`);
    await expect(page.getByRole("alert").getByText("This lesson is locked.")).toBeVisible();
  });
});

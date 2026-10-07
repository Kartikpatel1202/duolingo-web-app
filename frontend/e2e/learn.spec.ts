import { expect, skillNode, test } from "./fixtures";

test.describe("Learn page", () => {
  test("loads the course and learning path from the backend", async ({ page, backend }) => {
    const path = await backend.path();
    await page.goto("/learn");

    await expect(page.getByRole("heading", { level: 1, name: path.course.title })).toBeVisible();
    for (const unit of path.units) {
      await expect(page.getByRole("heading", { level: 2, name: unit.title })).toBeVisible();
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
    await expect(skillNode(page, "Ordering")).toHaveAccessibleName(/locked/);
  });

  test("an unlocked Unit 1 skill opens a lesson-intro card whose button starts the lesson", async ({ page, backend }) => {
    const snacks = (await backend.path()).units[0]!.skills.find((skill) => skill.title === "Snacks")!;
    await page.goto("/learn");

    await skillNode(page, "Snacks").click();
    const intro = page.getByRole("dialog", { name: /^Snacks/ });
    await expect(intro).toBeVisible();
    await expect(intro.getByRole("heading", { name: "Order at a café" })).toBeVisible();
    await expect(intro.getByText(`Lesson ${snacks.lessons_completed + 1} of ${snacks.total_lessons}`)).toBeVisible();

    await intro.getByRole("button", { name: "Start +10 XP" }).click();
    await expect(page).toHaveURL(new RegExp(`/lesson/${snacks.next_lesson_id}$`));
    await expect(page.getByRole("progressbar", { name: "Lesson progress" })).toBeVisible();
  });

  test("a locked skill explains how to unlock it and cannot be started", async ({ page }) => {
    await page.goto("/learn");

    await skillNode(page, "Ordering").click();
    const dialog = page.getByRole("dialog", { name: "Ordering" });
    await expect(dialog.getByText("Complete “Snacks” to unlock this skill.")).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Locked" })).toBeDisabled();
    await expect(dialog.getByRole("button", { name: "Start lesson" })).toHaveCount(0);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("the current skill is marked on the path and opens its details", async ({ page, backend }) => {
    const path = await backend.path();
    const current = path.units.flatMap((unit) => unit.skills).find((skill) => skill.id === path.current_skill_id)!;
    await page.goto("/learn");

    const node = page.locator("[data-current-skill]");
    await expect(node).toHaveCount(1);
    await expect(node).toBeInViewport();
    await node.getByRole("button").click();
    await expect(page.getByRole("dialog", { name: new RegExp(`^${current.title}`) })).toBeVisible();
  });

  test("each unit has a banner with a guidebook link, a chest and a trophy", async ({ page, backend }) => {
    const path = await backend.path();
    const unit = path.units[0]!;
    await page.goto("/learn");

    const section = page.getByRole("region", { name: unit.title });
    await expect(section.getByText(`Section 1, Unit ${unit.position}`)).toBeVisible();
    const done = unit.skills.filter((skill) => skill.status === "completed").length;
    await expect(section.getByRole("img", { name: `${done} of ${unit.skills.length} skills completed` })).toBeVisible();
    await expect(section.getByRole("img", { name: /^Treasure chest/ })).toBeVisible();

    await expect(section.getByRole("link", { name: `Guidebook for unit ${unit.position}` })).toHaveAttribute(
      "href",
      `/learn/guidebook/${unit.id}`,
    );
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
    await expect(skillNode(page, "Drinks")).toBeVisible();
  });

  test("a locked lesson URL is refused by the backend", async ({ page, backend }) => {
    const locked = (await backend.path()).units[2]!.skills[0]!;
    expect(locked.status).toBe("locked");
    const lessonId = (await backend.skill(locked.id)).lessons[0]!.id;
    await page.goto(`/lesson/${lessonId}`);
    await expect(page.getByRole("alert").getByText("This lesson is locked.")).toBeVisible();
  });
});

const SECTION_1 = [
  "Order at a café",
  "Greet people and say goodbye",
  "Say where you are from",
  "Introduce family and friends",
  "Describe people's personalities",
  "Say where your things are",
  "Talk about places in the city",
  "Discuss languages",
  "Talk about the weather",
  "Shop for fruits at the market",
];

test.describe("Section 1 path", () => {
  test("shows units 1–10 in order, each with its own header and guidebook", async ({ page, backend }) => {
    const path = await backend.path();
    expect(path.units.map((unit) => unit.title)).toEqual(SECTION_1);
    await page.goto("/learn");

    for (const unit of path.units) {
      const section = page.getByRole("region", { name: unit.title, exact: true });
      await expect(section.getByText(`Section ${unit.section}, Unit ${unit.position}`, { exact: true })).toBeAttached();
      await expect(section.getByRole("link", { name: `Guidebook for unit ${unit.position}` })).toHaveAttribute(
        "href",
        `/learn/guidebook/${unit.id}`,
      );
      // Four skills, then the unit's chest and trophy.
      await expect(section.locator("button[data-status]")).toHaveCount(unit.skills.length);
      await expect(section.getByRole("img", { name: /^Treasure chest/ })).toBeAttached();
      await expect(section.getByRole("img", { name: /skills completed$/ })).toBeAttached();
    }
  });

  test("every unit's guidebook is its own", async ({ request, backend }) => {
    const path = await backend.path();
    const firstPhrases = new Set<string>();
    for (const unit of path.units) {
      const guidebook = await (await request.get(`http://localhost:8001/api/units/${unit.id}/guidebook`)).json();
      expect(guidebook.unit_title).toBe(unit.title);
      firstPhrases.add(guidebook.sections[0].entries[0].text);
    }
    expect(firstPhrases.size).toBe(path.units.length);
  });

  test("units ahead of the learner offer “Jump here?”, which opens a lesson card that cannot start", async ({ page, backend }) => {
    const path = await backend.path();
    await page.goto("/learn");

    // The learner's own unit has no jump node; every unit after it has exactly one.
    const jumps = page.locator("button[data-jump]");
    await expect(jumps).toHaveCount(path.units.length - 1);
    const second = page.getByRole("region", { name: path.units[1]!.title, exact: true });
    await expect(second.getByText("Jump here?")).toBeAttached();

    await second.locator("button[data-jump]").click();
    // The unit's own lesson card opens under the node (no modal), naming the unit and its reward…
    const first = path.units[1]!.skills[0]!;
    const card = page.getByRole("dialog", { name: new RegExp(`^${first.title}, lesson 1 of`) });
    await expect(card).toContainText(path.units[1]!.title);
    // …but the lesson cannot be started: the unit is still locked on the server.
    await expect(card.getByRole("button", { name: /^Start/ })).toBeDisabled();
    expect((await backend.path()).units[1]!.skills[0]!.status).toBe("locked");
  });

  test("a locked skill shows its name on hover and cannot be started", async ({ page, backend }) => {
    const locked = (await backend.path()).units[0]!.skills[2]!;
    expect(locked.status).toBe("locked");
    await page.goto("/learn");

    await skillNode(page, locked.title).click();
    const dialog = page.getByRole("dialog", { name: locked.title });
    await expect(dialog.getByRole("button", { name: "Locked" })).toBeDisabled();
    await expect(dialog.getByRole("button", { name: "Start lesson" })).toHaveCount(0);
  });

  test("the path ends with the next section and offers a way back to the top", async ({ page }) => {
    await page.goto("/learn");
    const upNext = page.getByRole("region", { name: "Section 2" });
    await upNext.scrollIntoViewIfNeeded();
    await expect(upNext).toContainText("Up next");
    await expect(upNext.getByRole("button", { name: "Coming soon" })).toBeDisabled();

    const toTop = page.getByRole("button", { name: "Back to top" });
    await expect(toTop).toBeVisible();
    await toTop.click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(50);
    await expect(toTop).toBeHidden();
  });
});

test.describe("Unit 1 — Order at a café", () => {
  test("the header matches the reference: lime, section label, title and a guidebook button", async ({ page, backend }) => {
    const unit = (await backend.path()).units[0]!;
    expect(unit.theme).toBe("lime");
    await page.goto("/learn");

    const section = page.getByRole("region", { name: "Order at a café", exact: true });
    await expect(section.getByText("Section 1, Unit 1", { exact: true })).toBeVisible();
    const header = section.getByRole("heading", { level: 2 }).locator("xpath=ancestor::div[contains(@class,'sticky')]");
    await expect(header).toHaveCSS("background-color", "rgb(88, 204, 2)");
    await expect(section.getByRole("link", { name: "Guidebook for unit 1", exact: true })).toHaveAttribute(
      "href",
      `/learn/guidebook/${unit.id}`,
    );
  });

  test("the path is a short winding column: four star coins with the chest after the third, then the trophy", async ({ page, backend }) => {
    const unit = (await backend.path()).units[0]!;
    expect(unit.skills.map((skill) => skill.icon)).toEqual(["star", "star", "star", "star"]);
    await page.goto("/learn");

    const section = page.getByRole("region", { name: "Order at a café", exact: true });
    const coins = section.locator("button[data-status]");
    await expect(coins).toHaveCount(4);
    const chest = section.getByRole("img", { name: /^Treasure chest/ });
    const trophy = section.getByRole("img", { name: /skills completed$/ });
    await chest.scrollIntoViewIfNeeded();

    const y = async (target: typeof chest) => (await target.boundingBox())!.y;
    const third = await y(coins.nth(2));
    const fourth = await y(coins.nth(3));
    expect(await y(chest)).toBeGreaterThan(third);
    expect(await y(chest)).toBeLessThan(fourth);
    expect(await y(trophy)).toBeGreaterThan(fourth);
    // Items are packed closely, like the reference (not the default wide spacing).
    expect(fourth - third).toBeLessThan(260);
  });

  test("locked skills, the chest and the trophy use the artwork extracted from the reference", async ({ page, backend }) => {
    const unit = (await backend.path()).units[0]!;
    const locked = unit.skills.filter((skill) => skill.status === "locked").length;
    expect(locked).toBeGreaterThan(0);
    await page.goto("/learn");

    const section = page.getByRole("region", { name: "Order at a café", exact: true });
    await expect(section.locator('img[src$="/brand/path/star-locked.png"]')).toHaveCount(locked);
    await expect(section.locator('img[src$="/brand/path/chest-locked.png"]')).toHaveCount(1);
    await expect(section.locator('img[src$="/brand/path/trophy-locked.png"]')).toHaveCount(1);
    await expect(section.locator('img[src$="/brand/path/duo-front.png"]')).toBeVisible();
    for (const asset of ["star-locked", "chest-locked", "trophy-locked", "duo", "duo-front"]) {
      const response = await page.request.get(`/brand/path/${asset}.png`);
      expect(response.status(), asset).toBe(200);
    }
  });

  test("the learner's current skill is the lime coin with START or CONTINUE above it", async ({ page, backend }) => {
    const path = await backend.path();
    const current = path.units[0]!.skills.find((skill) => skill.id === path.current_skill_id)!;
    await page.goto("/learn");

    const coin = page.locator("[data-current-skill] button[data-status]");
    await expect(coin).toHaveCount(1);
    await expect(coin).toHaveAccessibleName(new RegExp(`^${current.title}`));
    await expect(coin).toHaveCSS("background-color", "rgb(88, 204, 2)");
    await expect(page.locator("[data-current-skill]").getByText(/^(Start|Continue)$/)).toBeVisible();
  });

  test("a fresh account sees the START coin and every other skill locked", async ({ page, backend }) => {
    await backend.reset(false);
    await page.goto("/learn");
    const section = page.getByRole("region", { name: "Order at a café", exact: true });
    await expect(section.locator("button[data-status]")).toHaveCount(4);
    await expect(section.locator('button[data-status="locked"]')).toHaveCount(3);
    await expect(section.locator("[data-current-skill]").getByText("Start")).toBeVisible();
  });

  test("the divider before Unit 2 carries its title", async ({ page }) => {
    await page.goto("/learn");
    await expect(page.getByText("Greet people and say goodbye", { exact: true }).first()).toBeAttached();
  });
});

test.describe("Unit 1 lesson flow", () => {
  test("path → intro card → START → loading screen → first exercise", async ({ page, backend }) => {
    await backend.reset(false); // a fresh learner starts at the first lesson
    const path = await backend.path();
    const first = path.units[0]!.skills[0]!;
    await page.goto("/learn");

    // The START coin opens an intro card; nothing has started yet.
    await skillNode(page, first.title).click();
    const intro = page.getByRole("dialog", { name: /^Drinks/ });
    await expect(intro.getByRole("heading", { name: "Order at a café" })).toBeVisible();
    await expect(intro.getByText("Lesson 1 of 2")).toBeVisible();
    await expect(page).toHaveURL(/\/learn$/);

    await intro.getByRole("button", { name: "Start +10 XP" }).click();
    await expect(page).toHaveURL(new RegExp(`/lesson/${first.next_lesson_id}$`));
    // The loading screen comes first: Duo, "LOADING...", a tip — and no exercise yet.
    const loading = page.getByLabel("Loading lesson");
    await expect(loading).toBeVisible();
    await expect(loading.getByText("Loading...")).toBeVisible();
    await expect(page.locator("[data-exercise-id]")).toHaveCount(0);
    await expect(loading.locator('img[src$="/brand/path/duo.png"]')).toBeVisible();

    // Then the first exercise: a picture question tagged NEW WORD, with SKIP and a disabled CHECK.
    await expect(page.locator("[data-exercise-id]")).toBeVisible();
    await expect(loading).toBeHidden();
    await expect(page.getByText("New word")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: /^Which one of these is “[^”]+”\?$/ })).toBeVisible();
    await expect(page.getByRole("progressbar", { name: "Lesson progress" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Skip" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Check" })).toBeDisabled();
  });

  test("the intro card closes with Escape and when clicking elsewhere", async ({ page, backend }) => {
    await page.goto("/learn");
    const current = (await backend.path()).units[0]!.skills.find((skill) => skill.status !== "completed")!;
    await skillNode(page, current.title).click();
    const intro = page.getByRole("dialog", { name: new RegExp(`^${current.title}`) });
    await expect(intro).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(intro).toBeHidden();

    await skillNode(page, current.title).click();
    await expect(intro).toBeVisible();
    await page.getByRole("region", { name: "Order at a café", exact: true }).getByRole("heading", { level: 2 }).first().click();
    await expect(intro).toBeHidden();
  });

  test("a completed skill offers Practice again and Legendary instead of a new lesson", async ({ page }) => {
    await page.goto("/learn");
    await skillNode(page, "Drinks").click();
    const intro = page.getByRole("dialog", { name: /^Drinks/ });
    await expect(intro.getByText("2 lessons complete")).toBeVisible();
    await expect(intro.getByRole("button", { name: "Practice again" })).toBeVisible();
    await expect(intro.getByRole("button", { name: "Legendary" })).toBeVisible();
  });

  test("a locked skill explains itself instead of opening an intro card", async ({ page }) => {
    await page.goto("/learn");
    await skillNode(page, "Ordering").click();
    const dialog = page.getByRole("dialog", { name: "Ordering" });
    await expect(dialog.getByRole("button", { name: "Locked" })).toBeDisabled();
    await expect(page.getByRole("button", { name: /^Start/ })).toHaveCount(0);
  });
});

import type { Page } from "@playwright/test";

import { LEARNER, SESSION_STORAGE_KEY, expect, skillNode, test } from "./fixtures";

// These tests are about signing up and in, so they start without a session.
test.use({ authenticated: false });

const NEW_USER = { email: "sam.lee@example.com", password: "correct-horse" };

async function logIn(page: Page, email = LEARNER.email, password = LEARNER.password): Promise<void> {
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
}

async function signUp(page: Page, email = NEW_USER.email, password = NEW_USER.password, confirm = password) {
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(confirm);
  await page.getByRole("button", { name: "Sign up" }).click();
}

const storedSession = (page: Page) => page.evaluate((key) => window.localStorage.getItem(key), SESSION_STORAGE_KEY);

async function logOut(page: Page, isMobile: boolean): Promise<void> {
  const nav = page.getByRole("navigation", { name: "Primary" });
  await nav.getByRole("button", { name: "More" }).click();
  const menu = isMobile ? page.getByRole("dialog", { name: "More" }) : nav;
  await menu.getByRole("button", { name: "Log out" }).click();
}

test.describe("Landing → login and sign-up", () => {
  test("the landing buttons lead to the two forms, which link to each other", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("main").getByRole("link", { name: "I already have an account" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { level: 1, name: "Log in" })).toBeVisible();

    await page.getByRole("link", { name: "Sign up" }).click();
    await expect(page).toHaveURL(/\/welcome$/);
    await expect(page.getByRole("heading", { level: 1, name: "Create your profile" })).toBeVisible();

    await page.getByRole("main").getByRole("link", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.goto("/");
    await page.getByRole("main").getByRole("link", { name: "Get started" }).click();
    await expect(page).toHaveURL(/\/welcome$/);
  });
});

test.describe("Sign up", () => {
  test("the page has email, password and confirm fields, and no course selection", async ({ page }) => {
    await page.goto("/welcome");
    await expect(page.getByRole("textbox", { name: "Email" })).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Confirm password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign up" })).toBeVisible();
    await expect(page.getByText("Already have an account?")).toBeVisible();
    await expect(page.getByText("I want to learn")).toHaveCount(0);
  });

  test("invalid input is explained before anything is sent", async ({ page }) => {
    let requests = 0;
    await page.route("**/api/auth/signup", (route) => {
      requests += 1;
      return route.continue();
    });
    await page.goto("/welcome");

    await page.getByRole("button", { name: "Sign up" }).click();
    await expect(page.getByText("Enter your email.")).toBeVisible();
    await expect(page.getByText("Choose a password.")).toBeVisible();
    await expect(page.getByText("Type your password again.")).toBeVisible();

    await signUp(page, "sam@example", "short", "short");
    await expect(page.getByText("That email address doesn't look right.")).toBeVisible();
    await expect(page.getByText("Use at least 8 characters.")).toBeVisible();

    await signUp(page, "sam@example.com", "correct-horse", "correct-horses");
    await expect(page.getByText("The passwords don't match.")).toBeVisible();
    expect(requests).toBe(0);
  });

  test("registering creates the account, signs in and opens a fresh learning path", async ({ page }) => {
    await page.goto("/welcome");
    await signUp(page);

    await expect(page).toHaveURL(/\/learn$/);
    await expect(skillNode(page, "Drinks")).toBeVisible();
    // A new learner starts from the beginning: the first skill is open, the rest are locked.
    await expect(skillNode(page, "Drinks")).toHaveAttribute("data-status", "available");
    await expect(skillNode(page, "Snacks")).toHaveAttribute("data-status", "locked");
    expect(await storedSession(page)).toBeTruthy();

    await page.reload();
    await expect(page).toHaveURL(/\/learn$/);
    await expect(skillNode(page, "Drinks")).toBeVisible();

    await page.goto("/settings");
    await expect(page.getByRole("region", { name: "Account" })).toContainText("@samlee");
  });

  test("an email that is already registered is refused with a clear message", async ({ page }) => {
    await page.goto("/welcome");
    await signUp(page, LEARNER.email, "correct-horse");

    await expect(page.getByText("An account with this email already exists.")).toBeVisible();
    await expect(page).toHaveURL(/\/welcome$/);
    expect(await storedSession(page)).toBeNull();
  });

  test("a registered account can log out and log back in with the same credentials", async ({ page, isMobile }) => {
    await page.goto("/welcome");
    await signUp(page);
    await expect(skillNode(page, "Drinks")).toBeVisible();

    await logOut(page, isMobile);
    await expect(page).toHaveURL(/\/$/);
    expect(await storedSession(page)).toBeNull();

    await page.getByRole("main").getByRole("link", { name: "I already have an account" }).click();
    await logIn(page, NEW_USER.email, NEW_USER.password);
    await expect(page).toHaveURL(/\/learn$/);
    await expect(skillNode(page, "Drinks")).toHaveAttribute("data-status", "available");
  });

  test("the email is not case-sensitive when logging in", async ({ page, isMobile }) => {
    await page.goto("/welcome");
    await signUp(page, "Sam.Lee@Example.com");
    await expect(skillNode(page, "Drinks")).toBeVisible();
    await logOut(page, isMobile);

    await page.goto("/login");
    await logIn(page, "sam.lee@example.com", NEW_USER.password);
    await expect(page).toHaveURL(/\/learn$/);
  });

  test("two accounts keep separate progress", async ({ page, isMobile }) => {
    await page.goto("/login");
    await logIn(page); // the seeded learner has finished skills
    await expect(skillNode(page, "Snacks")).toHaveAttribute("data-status", "in_progress");
    await logOut(page, isMobile);

    await page.goto("/welcome");
    await signUp(page);
    await expect(skillNode(page, "Snacks")).toHaveAttribute("data-status", "locked");
  });
});

test.describe("Login", () => {
  test("the page has no demo notice", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { level: 1, name: "Log in" })).toBeVisible();
    await expect(page.getByText(/demo/i)).toHaveCount(0);
  });

  test("empty and malformed fields are explained before anything is sent", async ({ page }) => {
    let requests = 0;
    await page.route("**/api/auth/login", (route) => {
      requests += 1;
      return route.continue();
    });
    await page.goto("/login");

    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByText("Enter your email.")).toBeVisible();
    await expect(page.getByText("Enter your password.")).toBeVisible();

    await page.getByRole("textbox", { name: "Email" }).fill("alex@example");
    await page.getByLabel("Password", { exact: true }).fill("anything");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByText("That email address doesn't look right.")).toBeVisible();
    expect(requests).toBe(0);
  });

  test("wrong credentials show the same clear error and do not sign in", async ({ page }) => {
    await page.goto("/login");
    await logIn(page, LEARNER.email, "not-the-password");
    await expect(page.getByRole("alert").filter({ hasText: "Wrong email or password." })).toHaveText("Wrong email or password.");
    await expect(page).toHaveURL(/\/login$/);
    expect(await storedSession(page)).toBeNull();

    await logIn(page, "nobody@example.com", LEARNER.password);
    await expect(page.getByRole("alert").filter({ hasText: "Wrong email or password." })).toHaveText("Wrong email or password.");
  });

  test("the seeded learner's email and password open the learning path", async ({ page }) => {
    await page.goto("/login");
    await logIn(page);

    await expect(page).toHaveURL(/\/learn$/);
    await expect(skillNode(page, "Drinks")).toBeVisible();
    expect(await storedSession(page)).toBeTruthy();
  });

  test("the session survives a refresh, and the login page skips ahead while signed in", async ({ page }) => {
    await page.goto("/login");
    await logIn(page);
    await expect(skillNode(page, "Drinks")).toBeVisible();

    await page.reload();
    await expect(page).toHaveURL(/\/learn$/);
    await expect(skillNode(page, "Drinks")).toBeVisible();

    await page.goto("/login");
    await expect(page).toHaveURL(/\/learn$/);
    await page.goto("/welcome");
    await expect(page).toHaveURL(/\/learn$/);
  });
});

test.describe("Demo link", () => {
  test("opening /demo signs in as the seeded learner without typing anything", async ({ page }) => {
    await page.goto("/demo");

    await expect(page).toHaveURL(/\/learn$/);
    // The seeded learner's progress, not a new account's.
    await expect(skillNode(page, "Snacks")).toHaveAttribute("data-status", "in_progress");
    expect(await storedSession(page)).toBeTruthy();
  });

  test("where the API has the demo switched off, the page offers the ordinary login", async ({ page }) => {
    await page.route("**/api/auth/demo", (route) =>
      route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ error: { code: "DEMO_LOGIN_UNAVAILABLE", message: "The demo is not available here." } }),
      }),
    );
    await page.goto("/demo");

    await expect(page.getByRole("alert").filter({ hasText: "The demo isn't available here." })).toBeVisible();
    await page.getByRole("main").getByRole("link", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/login$/);
    expect(await storedSession(page)).toBeNull();
  });
});

test.describe("Protected pages", () => {
  for (const route of ["/learn", "/shop", "/profile", "/leaderboard", "/quests", "/settings", "/lesson/1"]) {
    test(`${route} sends a signed-out visitor to log in`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login\?next=/);
      await expect(page.getByRole("heading", { level: 1, name: "Log in" })).toBeVisible();
    });
  }

  test("after logging in, the visitor lands on the page they asked for", async ({ page }) => {
    await page.goto("/shop");
    await expect(page).toHaveURL(/\/login\?next=/);
    await logIn(page);
    await expect(page).toHaveURL(/\/shop$/);
    await expect(page.getByRole("heading", { level: 1, name: "Shop" })).toBeVisible();
  });

  test("logging out locks the app again", async ({ page, isMobile }) => {
    await page.goto("/login");
    await logIn(page);
    await expect(skillNode(page, "Drinks")).toBeVisible();

    await logOut(page, isMobile);
    await expect(page).toHaveURL(/\/$/);
    expect(await storedSession(page)).toBeNull();
    await page.goto("/learn");
    await expect(page).toHaveURL(/\/login\?next=/);
  });

  test("a session the server no longer accepts is dropped", async ({ page }) => {
    await page.addInitScript((key) => window.localStorage.setItem(key, "1.9999999999.forged"), SESSION_STORAGE_KEY);
    await page.goto("/learn");

    await expect(page).toHaveURL(/\/login\?next=/);
    expect(await storedSession(page)).toBeNull();
  });
});

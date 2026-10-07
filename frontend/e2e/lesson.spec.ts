import type { Page } from "@playwright/test";

import { API_URL, expect, skillNode, test, type Backend } from "./fixtures";
import { LessonDriver } from "./lesson-driver";

/** The demo learner's current lesson: Snacks · lesson 2 (all five exercise types). */
async function currentLessonId(backend: Backend): Promise<number> {
  const path = await backend.path();
  return path.current_lesson_id!;
}

const hearts = (page: Page, n: number) =>
  page.getByRole("img", { name: `${n} of 5 hearts` });

test.describe("Lesson player", () => {
  test("opens an available lesson and creates the attempt on the server", async ({ page, request, backend }) => {
    const lessonId = await currentLessonId(backend);
    const lesson = await LessonDriver.open(page, request, lessonId);

    await expect(page.getByRole("progressbar", { name: "Lesson progress" })).toHaveAttribute("aria-valuenow", "0");
    await expect(hearts(page, 5)).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText((await lesson.current()).prompt);
    // The page created an attempt: asking again resumes it (200) instead of creating one (201).
    const resume = await request.post(`${API_URL}/api/lessons/${lessonId}/attempts`, { data: {} });
    expect(resume.status()).toBe(200);
  });

  test("multiple choice: correct answer, positive feedback, Continue advances", async ({ page, request, backend }) => {
    const lesson = await LessonDriver.open(page, request, await currentLessonId(backend));
    const first = await lesson.advanceTo("multiple_choice");

    await expect(lesson.checkButton).toBeDisabled();
    await lesson.answer(true);
    await expect(lesson.exerciseContainer.locator('[aria-pressed="false"]').first()).toBeDisabled();
    await expect(hearts(page, 5)).toBeVisible();
    await lesson.continue();

    await expect(lesson.exerciseContainer).not.toHaveAttribute("data-exercise-id", String(first.id));
    await expect(page.getByRole("progressbar", { name: "Lesson progress" })).not.toHaveAttribute("aria-valuenow", "0");
  });

  test("multiple choice: incorrect answer reveals the solution and costs one heart", async ({ page, request, backend }) => {
    const lesson = await LessonDriver.open(page, request, await currentLessonId(backend));
    await lesson.advanceTo("multiple_choice");
    await lesson.answer(false);

    await expect(lesson.feedback.getByText("Correct solution:")).toBeVisible();
    await expect(lesson.feedback.getByText("−1 heart")).toBeVisible();
    await expect(hearts(page, 4)).toBeVisible();
    expect((await backend.me()).hearts.current).toBe(4);

    // The missed exercise comes back at the end of the queue.
    await lesson.continue();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("a retried submission does not cost a second heart", async ({ page, request, backend }) => {
    const lesson = await LessonDriver.open(page, request, await currentLessonId(backend));
    const exercise = await lesson.current();
    const submissionIds: string[] = [];
    let dropFirstResponse = true;
    await page.route("**/api/lessons/*/check", async (route) => {
      submissionIds.push(route.request().postDataJSON().submission_id);
      if (dropFirstResponse) {
        dropFirstResponse = false;
        await route.fetch(); // the server records the wrong answer (and the heart)…
        await route.abort("connectionreset"); // …but the browser never sees the reply
        return;
      }
      await route.continue();
    });

    await lesson.enter(exercise, lesson.wrongAnswer(exercise));
    await lesson.checkButton.click();
    await expect(page.getByText("Your answer wasn't checked — try again.")).toBeVisible();
    await expect(lesson.exerciseContainer).toHaveAttribute("data-exercise-id", String(exercise.id));

    await page.getByRole("button", { name: "Try again" }).click();
    await expect(lesson.feedback).toHaveAttribute("aria-label", "Incorrect");
    expect(submissionIds).toHaveLength(2);
    expect(submissionIds[1]).toBe(submissionIds[0]);
    await expect(hearts(page, 4)).toBeVisible();
    expect((await backend.me()).hearts.current).toBe(4);
  });

  test("word bank: right order is correct, wrong order is not", async ({ page, request, backend }) => {
    const lesson = await LessonDriver.open(page, request, await currentLessonId(backend));
    const exercise = await lesson.advanceTo("word_bank");
    const correct = lesson.correctAnswer(exercise);
    if (correct.type !== "word_bank") throw new Error("expected a word bank answer");

    // Tapping an answer tile sends it back to the bank.
    const [firstTile] = correct.tile_ids;
    await lesson.enter(exercise, { type: "word_bank", tile_ids: [firstTile!] });
    await page.getByRole("group", { name: "Your answer" }).locator(`[data-tile-id="${firstTile}"]`).click();
    await expect(page.getByRole("group", { name: "Your answer" }).getByRole("button")).toHaveCount(0);

    await lesson.enter(exercise, { type: "word_bank", tile_ids: [...correct.tile_ids].reverse() });
    await lesson.checkButton.click();
    await expect(lesson.feedback).toHaveAttribute("aria-label", "Incorrect");
    await lesson.continue();

    const again = await lesson.advanceTo("word_bank");
    expect(again.id).not.toBe(exercise.id); // the second word bank comes before the retried one
    await lesson.answer(true);
  });

  test("match pairs: each pair stays selected and locked, then the server grades the set", async ({ page, request, backend }) => {
    const lesson = await LessonDriver.open(page, request, await currentLessonId(backend));
    const exercise = await lesson.advanceTo("match_pairs");
    const correct = lesson.correctAnswer(exercise);
    if (correct.type !== "match_pairs") throw new Error("expected match pairs");
    const [first, ...rest] = correct.pairs;
    const left = (id: string) => page.locator(`[data-pair-item="left:${id}"]`);
    const right = (id: string) => page.locator(`[data-pair-item="right:${id}"]`);

    // Left card first: it shows as selected and nothing is paired yet.
    await left(first!.left_id).click();
    await expect(left(first!.left_id)).toHaveAttribute("aria-pressed", "true");
    // Then its partner in the other column: both stay selected, carry the pair number and lock.
    await right(first!.right_id).click();
    for (const card of [left(first!.left_id), right(first!.right_id)]) {
      await expect(card).toHaveAccessibleName(/pair 1/);
      await expect(card).toHaveAttribute("aria-pressed", "true");
      await expect(card).toBeDisabled();
    }
    // CHECK waits for every pair.
    await expect(lesson.checkButton).toBeDisabled();

    // The other order works too: right card first, then left.
    for (const pair of rest) {
      await right(pair.right_id).click();
      await left(pair.left_id).click();
    }
    await expect(lesson.checkButton).toBeEnabled();
    await lesson.checkButton.click();
    await expect(lesson.feedback).toHaveAttribute("aria-label", "Correct");
  });

  test("fill in the blank", async ({ page, request, backend }) => {
    const lesson = await LessonDriver.open(page, request, await currentLessonId(backend));
    const exercise = await lesson.advanceTo("fill_blank");
    const correct = lesson.correctAnswer(exercise);
    if (correct.type !== "fill_blank") throw new Error("expected fill blank");

    await lesson.enter(exercise, correct);
    await expect(page.getByLabel(`Blank: ${correct.text}`)).toBeVisible();
    await lesson.checkButton.click();
    await expect(lesson.feedback).toHaveAttribute("aria-label", "Correct");
  });

  test("type the answer: Enter checks and Enter continues", async ({ page, request, backend }) => {
    const lesson = await LessonDriver.open(page, request, await currentLessonId(backend));
    const exercise = await lesson.advanceTo("type_answer");
    const correct = lesson.correctAnswer(exercise);
    if (correct.type !== "type_answer") throw new Error("expected type answer");

    const input = page.getByRole("textbox", { name: /Type your answer in Spanish/ });
    await expect(lesson.checkButton).toBeDisabled();
    await input.fill(`  ${correct.text.toUpperCase()}  `); // case/spacing are forgiven by the server
    await input.press("Enter");
    await expect(lesson.feedback).toHaveAttribute("aria-label", "Correct");
    await page.keyboard.press("Enter");
    await expect(lesson.exerciseContainer).not.toHaveAttribute("data-exercise-id", String(exercise.id));
  });

  test("completing the lesson awards XP, streak, progress, unlock and achievement", async ({ page, request, backend }) => {
    // A whole journey (play, celebrate, review, return to the path, replay by API): allow for a slow phone.
    test.setTimeout(60_000);
    const before = await backend.me();
    const lesson = await LessonDriver.open(page, request, await currentLessonId(backend));
    const completion = page.waitForResponse((r) => r.url().includes("/complete") && r.request().method() === "POST");
    await lesson.finish({ mistakes: 1 });
    const result = await (await completion).json();

    await expect(page.getByRole("heading", { level: 1, name: "Lesson complete!" })).toBeVisible();
    await expect(page.getByLabel(`${result.xp_awarded} XP earned`)).toBeVisible();
    expect(result.xp_awarded).toBe(10); // one mistake → no perfect bonus
    await expect(page.getByLabel(`${before.streak.current + 1} day streak`)).toBeVisible();
    await expect(page.getByText("New skill unlocked: Ordering")).toBeVisible();
    await expect(page.getByText("Achievement unlocked!")).toBeVisible();
    await expect(page.getByText("On Fire")).toBeVisible();

    await page.getByRole("button", { name: "Review lesson" }).click();
    await expect(page.getByRole("heading", { name: "Lesson review" })).toBeVisible();

    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(/\/learn$/);
    await expect(skillNode(page, "Snacks")).toHaveAttribute("data-status", "completed");
    await expect(skillNode(page, "Ordering")).toHaveAttribute("data-status", "available");
    await expect(page.getByRole("img", { name: `${before.total_xp + 10} total XP` })).toBeVisible();

    // Completing the same attempt again changes nothing (idempotent).
    const again = await request.post(`${API_URL}/api/progress/lesson/${lesson.lesson.id}/complete`, {
      data: { attempt_id: result.attempt_id },
    });
    expect((await again.json()).xp_awarded).toBe(10);
    expect((await backend.me()).total_xp).toBe(before.total_xp + 10);
  });

  test("replaying a completed lesson shows practice, not more XP", async ({ page, request, backend }) => {
    const before = await backend.me();
    const lesson = await LessonDriver.open(page, request, (await backend.path()).units[0]!.skills[0]!.next_lesson_id!);
    await lesson.finish();
    await expect(page.getByRole("heading", { level: 1, name: "Practice complete!" })).toBeVisible();
    await expect(page.getByLabel("0 XP earned")).toBeVisible();
    expect((await backend.me()).total_xp).toBe(before.total_xp);
  });

  test("running out of hearts blocks the lesson until a refill", async ({ page, request, backend }) => {
    const lesson = await LessonDriver.open(page, request, await currentLessonId(backend));
    for (let i = 0; i < 5; i++) {
      await lesson.answer(false);
      await lesson.continue();
    }
    const dialog = page.getByRole("dialog", { name: "You ran out of hearts!" });
    await expect(dialog).toBeVisible();
    await expect(hearts(page, 0)).toBeVisible();
    await page.keyboard.press("Escape"); // cannot be dismissed without a choice
    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: /Refill for 50 gems/ }).click();
    await expect(dialog).toBeHidden();
    await expect(hearts(page, 5)).toBeVisible();
    const me = await backend.me();
    expect(me.hearts.current).toBe(5);
    await lesson.answer(true);
  });

  test("a refresh in the middle of the lesson resumes where it left off", async ({ page, request, backend }) => {
    const lesson = await LessonDriver.open(page, request, await currentLessonId(backend));
    const first = await lesson.answer(true);
    await lesson.continue();
    const second = await lesson.answer(true);
    await lesson.continue();
    const third = await lesson.current();

    await page.reload();
    await expect(lesson.exerciseContainer).toHaveAttribute("data-exercise-id", String(third.id));
    const solved = String(Math.round((2 / lesson.lesson.exercises.length) * 100));
    await expect(page.getByRole("progressbar", { name: "Lesson progress" })).toHaveAttribute("aria-valuenow", solved);
    expect([first.id, second.id]).not.toContain(third.id);
    await lesson.finish();
    await expect(page.getByRole("heading", { level: 1, name: "Lesson complete!" })).toBeVisible();
  });

  test("a failed check keeps the answer and does not advance", async ({ page, request, backend }) => {
    const lesson = await LessonDriver.open(page, request, await currentLessonId(backend));
    const exercise = await lesson.current();
    await page.route("**/api/lessons/*/check", (route) =>
      route.fulfill({ status: 503, contentType: "application/json", body: "{}" }),
    );
    await lesson.enter(exercise, lesson.correctAnswer(exercise));
    await lesson.checkButton.click();
    await expect(page.getByText("Your answer wasn't checked — try again.")).toBeVisible({ timeout: 15_000 });
    await expect(lesson.exerciseContainer).toHaveAttribute("data-exercise-id", String(exercise.id));
    await expect(hearts(page, 5)).toBeVisible();

    await page.unroute("**/api/lessons/*/check");
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(lesson.feedback).toHaveAttribute("aria-label", "Correct");
  });

  test("exiting asks for confirmation and progress is kept", async ({ page, request, backend }) => {
    const lesson = await LessonDriver.open(page, request, await currentLessonId(backend));
    await lesson.answer(true);
    await lesson.continue();
    await page.getByRole("button", { name: "Exit lesson" }).click();
    const dialog = page.getByRole("dialog", { name: /^Wait, don’t go!/ });
    await dialog.getByRole("button", { name: "Keep learning" }).click();
    await expect(dialog).toBeHidden();
    await page.getByRole("button", { name: "Exit lesson" }).click();
    await page.getByRole("link", { name: "End session" }).click();
    await expect(page).toHaveURL(/\/learn$/);
  });

  test("audio: speaker buttons play, and degrade gracefully without speech support", async ({ page, request, backend }) => {
    const lessonId = await currentLessonId(backend);
    let lesson = await LessonDriver.open(page, request, lessonId);
    await lesson.advanceTo("word_bank");
    const speaker = lesson.exerciseContainer.getByRole("button", { name: /^Listen to/ });
    await expect(speaker).toBeEnabled();
    await speaker.click();

    await page.addInitScript(() => {
      // Simulate a browser without the Web Speech API.
      delete (window as { speechSynthesis?: unknown }).speechSynthesis;
    });
    lesson = await LessonDriver.open(page, request, lessonId);
    await lesson.advanceTo("word_bank");
    await expect(
      lesson.exerciseContainer.getByRole("button", { name: "Audio is not available in this browser" }),
    ).toBeDisabled();
  });
});

test.describe("Legendary challenge", () => {
  test("is offered on completed skills and awards a one-time bonus", async ({ page, request, backend }) => {
    await page.goto("/learn");
    await skillNode(page, "Drinks").click();
    await page.getByRole("dialog", { name: /^Drinks/ }).getByRole("button", { name: "Legendary" }).click();
    await expect(page).toHaveURL(/mode=legendary/);
    const lessonId = Number(new URL(page.url()).pathname.split("/").pop());

    const lesson = await LessonDriver.open(page, request, lessonId, "?mode=legendary");
    await expect(page.getByRole("timer")).toBeVisible();
    await expect(page.getByRole("img", { name: "3 mistakes left" })).toBeVisible();
    await lesson.answer(false);
    await expect(lesson.feedback.getByText("−1 heart")).toHaveCount(0); // no hearts in Legendary
    await expect(page.getByRole("img", { name: "2 mistakes left" })).toBeVisible();
    await lesson.continue();
    await lesson.finish();

    await expect(page.getByRole("heading", { level: 1, name: "Legendary!" })).toBeVisible();
    await expect(page.getByLabel("20 XP earned")).toBeVisible();
    expect((await backend.me()).hearts.current).toBe(5);
  });

  test("three mistakes end the challenge", async ({ page, request, backend }) => {
    const greetings = (await backend.path()).units[0]!.skills[0]!;
    const lesson = await LessonDriver.open(page, request, greetings.next_lesson_id!, "?mode=legendary");
    for (let i = 0; i < 3; i++) {
      await lesson.answer(false);
      await lesson.continue();
    }
    await expect(page.getByRole("heading", { level: 1, name: "Too many mistakes" })).toBeVisible();
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(page.getByRole("img", { name: "3 mistakes left" })).toBeVisible();
  });
});

test.describe("Skip", () => {
  test("moves the exercise to the back: no check, no heart lost, no progress, and it still has to be solved", async ({
    page,
    request,
    backend,
  }) => {
    const lesson = await LessonDriver.open(page, request, await currentLessonId(backend));
    const first = await lesson.current();
    const progress = page.getByRole("progressbar", { name: "Lesson progress" });

    const checks: string[] = [];
    page.on("request", (r) => r.url().includes("/check") && checks.push(r.url()));
    await page.getByRole("button", { name: "Skip" }).click();

    const second = await lesson.current();
    expect(second.id).not.toBe(first.id);
    expect(checks).toHaveLength(0);
    await expect(progress).toHaveAttribute("aria-valuenow", "0");
    await expect(hearts(page, 5)).toBeVisible();
    expect((await backend.me()).hearts.current).toBe(5);

    // Solve everything else; the skipped exercise comes back last and must still be answered.
    for (let i = 0; i < lesson.lesson.exercises.length - 1; i += 1) {
      await lesson.answer(true);
      await lesson.continue();
    }
    await expect(page.getByRole("button", { name: "Skip" })).toBeDisabled(); // nothing left to skip to
    expect((await lesson.current()).id).toBe(first.id);
    await lesson.answer(true);
    await lesson.continue();
    await expect(page.getByRole("heading", { level: 1, name: /complete!$/ })).toBeVisible();
  });
});

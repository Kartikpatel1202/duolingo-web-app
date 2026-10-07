/**
 * Drives the real lesson UI. Correct answers come from the backend's test-only answer key
 * (mounted only with ENABLE_TEST_ROUTES), never from the learner-facing API.
 */
import { expect, type APIRequestContext, type Locator, type Page } from "@playwright/test";

import type { AnswerIn, Exercise, Lesson } from "../src/types/api";
import { API_URL } from "./fixtures";

interface KeyEntry {
  exercise_id: number;
  answer: AnswerIn;
}

export class LessonDriver {
  private constructor(
    readonly page: Page,
    readonly lesson: Lesson,
    private readonly key: Map<number, AnswerIn>,
  ) {}

  static async open(page: Page, request: APIRequestContext, lessonId: number, query = ""): Promise<LessonDriver> {
    const lesson: Lesson = await (await request.get(`${API_URL}/api/lessons/${lessonId}`)).json();
    const entries: KeyEntry[] = await (await request.get(`${API_URL}/api/test/lessons/${lessonId}/answer-key`)).json();
    await page.goto(`/lesson/${lessonId}${query}`);
    const driver = new LessonDriver(page, lesson, new Map(entries.map((entry) => [entry.exercise_id, entry.answer])));
    await expect(driver.exerciseContainer).toBeVisible();
    return driver;
  }

  get exerciseContainer(): Locator {
    return this.page.locator("[data-exercise-id]");
  }

  get checkButton(): Locator {
    return this.page.getByRole("button", { name: /^(Check|Try again)$/ });
  }

  get continueButton(): Locator {
    return this.page.getByRole("button", { name: "Continue" });
  }

  get feedback(): Locator {
    return this.page.getByRole("status").filter({ has: this.page.getByRole("button", { name: "Continue" }) });
  }

  async current(): Promise<Exercise> {
    await expect(this.exerciseContainer).toBeVisible();
    const id = Number(await this.exerciseContainer.getAttribute("data-exercise-id"));
    const exercise = this.lesson.exercises.find((e) => e.id === id);
    if (!exercise) throw new Error(`Exercise ${id} is not in lesson ${this.lesson.id}`);
    return exercise;
  }

  correctAnswer(exercise: Exercise): AnswerIn {
    const answer = this.key.get(exercise.id);
    if (!answer) throw new Error(`No answer key for exercise ${exercise.id}`);
    return answer;
  }

  /** Enter `answer` through the UI controls of the exercise type. */
  async enter(exercise: Exercise, answer: AnswerIn): Promise<void> {
    const scope = this.exerciseContainer;
    switch (answer.type) {
      case "multiple_choice":
        await scope.locator(`[data-option-id="${answer.option_id}"]`).click();
        return;
      case "word_bank":
        for (const tileId of answer.tile_ids) {
          await scope.getByRole("group", { name: "Word bank" }).locator(`[data-tile-id="${tileId}"]`).click();
        }
        return;
      case "match_pairs":
        for (const pair of answer.pairs) {
          await scope.locator(`[data-pair-item="left:${pair.left_id}"]`).click();
          await scope.locator(`[data-pair-item="right:${pair.right_id}"]`).click();
        }
        return;
      case "fill_blank":
        if (exercise.type === "fill_blank" && exercise.content.options) {
          await scope.getByRole("group", { name: "Options" }).getByRole("button", { name: answer.text, exact: true }).click();
        } else {
          await scope.getByLabel("Missing word").fill(answer.text);
        }
        return;
      case "type_answer":
        await scope.getByRole("textbox").fill(answer.text);
        return;
    }
  }

  /** A well-formed but wrong answer for the exercise. */
  wrongAnswer(exercise: Exercise): AnswerIn {
    const correct = this.correctAnswer(exercise);
    switch (correct.type) {
      case "multiple_choice": {
        const options = exercise.type === "multiple_choice" ? exercise.content.options : [];
        return { ...correct, option_id: options.find((o) => o.id !== correct.option_id)!.id };
      }
      case "word_bank":
        return { ...correct, tile_ids: correct.tile_ids.slice(0, -1) };
      case "match_pairs": {
        const rights = correct.pairs.map((pair) => pair.right_id);
        const rotated = [...rights.slice(1), rights[0]!];
        return { ...correct, pairs: correct.pairs.map((pair, i) => ({ left_id: pair.left_id, right_id: rotated[i]! })) };
      }
      case "fill_blank": {
        const options = exercise.type === "fill_blank" ? (exercise.content.options ?? []) : [];
        return { ...correct, text: options.find((o) => o !== correct.text) ?? "zzz" };
      }
      case "type_answer":
        return { ...correct, text: "esto no es correcto" };
    }
  }

  async answer(correct: boolean): Promise<Exercise> {
    const exercise = await this.current();
    await this.enter(exercise, correct ? this.correctAnswer(exercise) : this.wrongAnswer(exercise));
    await this.checkButton.click();
    await expect(this.feedback).toBeVisible();
    await expect(this.feedback).toHaveAttribute("aria-label", correct ? "Correct" : "Incorrect");
    return exercise;
  }

  async continue(): Promise<void> {
    await this.continueButton.click();
    await expect(this.feedback).toBeHidden();
  }

  /** Answer correctly until the current exercise is of `type`. */
  async advanceTo(type: Exercise["type"]): Promise<Exercise> {
    for (let i = 0; i < this.lesson.exercises.length; i++) {
      const exercise = await this.current();
      if (exercise.type === type) return exercise;
      await this.answer(true);
      await this.continue();
      await expect(this.exerciseContainer).not.toHaveAttribute("data-exercise-id", String(exercise.id));
    }
    throw new Error(`No ${type} exercise in lesson ${this.lesson.id}`);
  }

  get completionHeading(): Locator {
    return this.page.getByRole("heading", { level: 1, name: /complete!|Legendary!/ });
  }

  /** Play every remaining exercise correctly; `mistakes` wrong answers are made first. */
  async finish({ mistakes = 0 }: { mistakes?: number } = {}): Promise<void> {
    for (let i = 0; i < mistakes; i++) {
      await this.answer(false);
      await this.continue();
    }
    for (;;) {
      // Between two exercises neither is mounted for a moment: wait for one or the other.
      await expect(this.exerciseContainer.or(this.completionHeading)).toBeVisible();
      if (await this.completionHeading.isVisible()) return;
      await this.answer(true);
      await this.continue();
    }
  }
}

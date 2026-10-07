import type { Page } from "@playwright/test";

import { API_URL, expect, test } from "./fixtures";

import type { Guidebook } from "../src/types/api";

/**
 * Replaces the browser's speech engine with a recorder, so tests can assert exactly what is
 * spoken and decide when an utterance "finishes" (headless browsers have no voices).
 */
async function stubSpeech(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const state: { spoken: string[]; current: SpeechSynthesisUtterance | null } = { spoken: [], current: null };
    const fake = {
      speak(utterance: SpeechSynthesisUtterance) {
        state.spoken.push(`${utterance.lang}|${utterance.text}`);
        state.current = utterance;
      },
      cancel() {
        const interrupted = state.current;
        state.current = null;
        interrupted?.onerror?.call(interrupted, new Event("error") as SpeechSynthesisErrorEvent);
      },
    };
    Object.defineProperty(window, "speechSynthesis", { value: fake, configurable: true });
    Object.assign(window, {
      __spoken: () => state.spoken,
      __finishSpeech: () => {
        const finished = state.current;
        state.current = null;
        finished?.onend?.call(finished, new Event("end") as SpeechSynthesisEvent);
      },
    });
  });
}

const spoken = (page: Page) => page.evaluate(() => (window as unknown as { __spoken: () => string[] }).__spoken());
const finishSpeech = (page: Page) =>
  page.evaluate(() => (window as unknown as { __finishSpeech: () => void }).__finishSpeech());

test.describe("Guidebook", () => {
  test("opens from the unit banner and shows the unit's content from the API", async ({ page, request, backend }) => {
    const unit = (await backend.path()).units[0]!;
    const guidebook: Guidebook = await (await request.get(`${API_URL}/api/units/${unit.id}/guidebook`)).json();
    await page.goto("/learn");

    await page.getByRole("link", { name: `Guidebook for unit ${unit.position}`, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/learn/guidebook/${unit.id}$`));
    await expect(page.getByRole("heading", { level: 1, name: `Unit ${unit.position} Guidebook` })).toBeVisible();
    await expect(page.getByText(guidebook.introduction)).toBeVisible();

    for (const section of guidebook.sections) {
      const region = page.getByRole("region", { name: section.title });
      await expect(region).toBeVisible();
      for (const entry of section.entries) {
        await expect(region.getByText(entry.text, { exact: true }).first()).toBeVisible();
        await expect(region.getByText(entry.translation, { exact: true }).first()).toBeVisible();
      }
    }

    const tip = guidebook.sections.find((section) => section.kind === "tip")!;
    const table = page.getByRole("region", { name: tip.title }).getByRole("table");
    await expect(table.getByRole("columnheader", { name: "Spanish" })).toBeVisible();
    await expect(table.getByRole("row")).toHaveCount(1 + tip.entries.filter((entry) => entry.kind === "term").length);

    await page.getByRole("link", { name: "Back", exact: true }).click();
    await expect(page).toHaveURL(/\/learn$/);
  });

  test("speakers play the phrase, one at a time, and return to idle", async ({ page, request, backend }) => {
    await stubSpeech(page);
    const unit = (await backend.path()).units[0]!;
    const guidebook: Guidebook = await (await request.get(`${API_URL}/api/units/${unit.id}/guidebook`)).json();
    const [first, second] = guidebook.sections[0]!.entries;
    await page.goto(`/learn/guidebook/${unit.id}`);

    const firstSpeaker = page.getByRole("button", { name: `Listen to “${first!.text}”` });
    await expect(firstSpeaker).toHaveAttribute("aria-pressed", "false");
    await firstSpeaker.click();
    expect(await spoken(page)).toEqual([`es-ES|${first!.text}`]);
    // While it plays, the same control is pressed and offers to stop.
    const stop = page.getByRole("button", { name: "Stop audio" });
    await expect(stop).toHaveAttribute("aria-pressed", "true");

    // Starting another phrase interrupts the first: never two at once.
    await page.getByRole("button", { name: `Listen to “${second!.text}”` }).click();
    expect(await spoken(page)).toEqual([`es-ES|${first!.text}`, `es-ES|${second!.text}`]);
    await expect(page.getByRole("button", { name: "Stop audio" })).toHaveCount(1);
    await expect(firstSpeaker).toHaveAttribute("aria-pressed", "false");

    // When playback ends, every speaker is idle again.
    await finishSpeech(page);
    await expect(page.getByRole("button", { name: "Stop audio" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: `Listen to “${second!.text}”` })).toHaveAttribute("aria-pressed", "false");
  });

  test("every unit's guidebook fits the screen in dark mode", async ({ page, backend }) => {
    await page.addInitScript(() => window.localStorage.setItem("lingo-theme", "dark"));
    for (const unit of (await backend.path()).units) {
      await page.goto(`/learn/guidebook/${unit.id}`);
      await expect(page.getByRole("heading", { level: 1, name: `Unit ${unit.position} Guidebook` })).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    }
  });

  test("a unit without a guidebook gets a friendly empty state", async ({ page }) => {
    await page.goto("/learn/guidebook/9999");
    await expect(page.getByRole("heading", { level: 1, name: "No guidebook yet" })).toBeVisible();
    await page.getByRole("link", { name: "Back to the path" }).click();
    await expect(page).toHaveURL(/\/learn$/);
  });
});

test.describe("Unit 1 guidebook content", () => {
  test("shows the café phrases and the “y & o” tip with its table and highlighted connectors", async ({ page, backend }) => {
    const unit = (await backend.path()).units[0]!;
    await page.goto(`/learn/guidebook/${unit.id}`);

    await expect(page.getByRole("heading", { level: 1, name: "Unit 1 Guidebook" })).toBeVisible();
    await expect(page.getByText("Explore grammar tips and key phrases for this unit")).toBeVisible();

    const phrases: [string, string][] = [
      ["Un vaso de agua, por favor.", "A glass of water, please."],
      ["Hola, quiero un té con azúcar.", "Hello, I want a tea with sugar."],
      ["Quiero un helado y un vaso de agua.", "I want an ice cream and a glass of water."],
      ["¿Un café o un té?", "A coffee or a tea?"],
      ["Un sándwich y un café, por favor.", "A sandwich and a coffee, please."],
    ];
    for (const [spanish, english] of phrases) {
      await expect(page.getByText(spanish, { exact: true }).first()).toBeVisible();
      await expect(page.getByText(english, { exact: true }).first()).toBeVisible();
      await expect(page.getByRole("button", { name: `Listen to “${spanish}”` }).first()).toBeVisible();
    }

    const tip = page.getByRole("region", { name: "Conjunctions: y & o" });
    await expect(tip.getByText("Spanish uses", { exact: false })).toContainText("y (and) and o (or)");
    const rows = tip.getByRole("row");
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(1)).toContainText("yand");
    await expect(rows.nth(2)).toContainText("oor");
    // The connector words stand out in the examples: "Un café y un helado."
    const examples = tip.getByRole("list", { name: "Examples" });
    await expect(examples.getByText("y", { exact: true })).toHaveClass(/text-sky-500/);
    await expect(examples.getByText("o", { exact: true })).toHaveClass(/text-sky-500/);
    await expect(examples.getByText("A coffee and an ice cream.")).toBeVisible();
  });
});

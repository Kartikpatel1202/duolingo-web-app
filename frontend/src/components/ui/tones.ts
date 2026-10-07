/**
 * Semantic colour tones shared by badges, pills, progress and avatars. Class names are written
 * out in full so Tailwind can see them.
 */
export type Tone = "leaf" | "sun" | "sky" | "cherry" | "grape" | "purple" | "ember" | "teal" | "pink" | "lime" | "neutral";

export const TONE_SOFT: Record<Tone, string> = {
  leaf: "bg-leaf-100 text-leaf-700",
  sun: "bg-sun-100 text-sun-700",
  sky: "bg-sky-100 text-sky-700",
  cherry: "bg-cherry-100 text-cherry-700",
  grape: "bg-grape-100 text-grape-700",
  purple: "bg-purple-100 text-purple-700",
  ember: "bg-ember-100 text-ember-600",
  teal: "bg-teal-100 text-teal-700",
  pink: "bg-pink-100 text-pink-700",
  lime: "bg-lime-100 text-lime-700",
  neutral: "bg-mist text-muted",
};

export const TONE_TEXT: Record<Tone, string> = {
  leaf: "text-leaf-500",
  sun: "text-sun-500",
  sky: "text-sky-500",
  cherry: "text-cherry-500",
  grape: "text-grape-500",
  purple: "text-purple-500",
  ember: "text-ember-500",
  teal: "text-teal-500",
  pink: "text-pink-500",
  lime: "text-lime-500",
  neutral: "text-muted",
};

export const TONE_SOLID: Record<Tone, string> = {
  leaf: "bg-leaf-500",
  sun: "bg-sun-500",
  sky: "bg-sky-500",
  cherry: "bg-cherry-500",
  grape: "bg-grape-500",
  purple: "bg-purple-500",
  ember: "bg-ember-500",
  teal: "bg-teal-500",
  pink: "bg-pink-500",
  lime: "bg-lime-500",
  neutral: "bg-line-strong",
};

/** CSS colour values (for SVG strokes). */
export const TONE_COLOR: Record<Tone, string> = {
  leaf: "var(--color-leaf-500)",
  sun: "var(--color-sun-500)",
  sky: "var(--color-sky-500)",
  cherry: "var(--color-cherry-500)",
  grape: "var(--color-grape-500)",
  purple: "var(--color-purple-500)",
  ember: "var(--color-ember-500)",
  teal: "var(--color-teal-500)",
  pink: "var(--color-pink-500)",
  lime: "var(--color-lime-500)",
  neutral: "var(--color-line-strong)",
};

const TONES = new Set<string>(["leaf", "sun", "sky", "cherry", "grape", "purple", "ember", "teal", "pink", "lime"]);

/** Backend colour names (unit themes, avatar colours) → a tone, with a safe fallback. */
export function toTone(name: string | null | undefined, fallback: Tone = "sky"): Tone {
  return name && TONES.has(name) ? (name as Tone) : fallback;
}

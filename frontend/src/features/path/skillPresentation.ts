/**
 * How each backend skill status is *presented*. The status itself always comes from the API —
 * nothing here decides whether a skill is locked.
 */
import { BookOpen, Dumbbell, Headphones, Star, type LucideIcon } from "lucide-react";

import type { Tone } from "@/components/ui";
import type { PathSkill, SkillStatus } from "@/types/api";

/**
 * Backend icon keys → icons: a star for core skills, a book for reading-led ones, headphones for
 * listening-led ones and a dumbbell for practice. Unknown keys fall back to the star, so new
 * content never renders a broken node.
 */
const SKILL_ICONS: Record<string, LucideIcon> = {
  star: Star,
  book: BookOpen,
  headphones: Headphones,
  dumbbell: Dumbbell,
};

export function skillIcon(key: string): LucideIcon {
  return SKILL_ICONS[key] ?? Star;
}

export const STATUS_LABEL: Record<SkillStatus, string> = {
  locked: "Locked",
  available: "Ready to start",
  in_progress: "In progress",
  completed: "Completed",
};

export const STATUS_TONE: Record<SkillStatus, Tone> = {
  locked: "neutral",
  available: "sky",
  in_progress: "leaf",
  completed: "sun",
};

/** Full description for screen readers, e.g. "People, in progress, 1 of 2 lessons". */
export function skillAccessibleName(skill: PathSkill): string {
  return `${skill.title}, ${STATUS_LABEL[skill.status].toLowerCase()}, ${skill.lessons_completed} of ${skill.total_lessons} lessons`;
}

/** Fill + 3D edge for a node of the given status inside a unit of the given colour. */
export const NODE_FILL: Record<Tone, string> = {
  leaf: "bg-leaf-500 [--tactile-edge:var(--color-leaf-600)]",
  sky: "bg-sky-500 [--tactile-edge:var(--color-sky-600)]",
  grape: "bg-grape-500 [--tactile-edge:var(--color-grape-600)]",
  purple: "bg-purple-500 [--tactile-edge:var(--color-purple-600)]",
  sun: "bg-sun-500 [--tactile-edge:var(--color-sun-600)]",
  cherry: "bg-cherry-500 [--tactile-edge:var(--color-cherry-600)]",
  ember: "bg-ember-500 [--tactile-edge:var(--color-ember-600)]",
  teal: "bg-teal-500 [--tactile-edge:var(--color-teal-600)]",
  pink: "bg-pink-500 [--tactile-edge:var(--color-pink-600)]",
  lime: "bg-lime-500 [--tactile-edge:var(--color-lime-600)]",
  neutral: "bg-locked [--tactile-edge:var(--color-locked-edge)]",
};

/** Colour of a node: grey when locked, purple once Legendary on every lesson, gold when done. */
export function nodeTone(status: SkillStatus, unitTone: Tone, legendary = false): Tone {
  if (status === "locked") return "neutral";
  if (legendary) return "grape";
  if (status === "completed") return "sun";
  return unitTone;
}

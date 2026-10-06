/**
 * How each backend skill status is *presented*. The status itself always comes from the API —
 * nothing here decides whether a skill is locked.
 */
import {
  Apple,
  BookOpen,
  Clock,
  Hand,
  House,
  Palette,
  PawPrint,
  Plane,
  ShoppingBag,
  User,
  type LucideIcon,
} from "lucide-react";

import type { Tone } from "@/components/ui";
import type { PathSkill, SkillStatus } from "@/types/api";

/** Backend icon keys → icons. Unknown keys fall back to a book, so new content never breaks. */
const SKILL_ICONS: Record<string, LucideIcon> = {
  wave: Hand,
  person: User,
  apple: Apple,
  house: House,
  paw: PawPrint,
  palette: Palette,
  plane: Plane,
  clock: Clock,
  bag: ShoppingBag,
};

export function skillIcon(key: string): LucideIcon {
  return SKILL_ICONS[key] ?? BookOpen;
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
  sun: "bg-sun-500 [--tactile-edge:var(--color-sun-600)]",
  cherry: "bg-cherry-500 [--tactile-edge:var(--color-cherry-600)]",
  ember: "bg-ember-500 [--tactile-edge:var(--color-ember-600)]",
  neutral: "bg-locked [--tactile-edge:var(--color-locked-edge)]",
};

export function nodeTone(status: SkillStatus, unitTone: Tone): Tone {
  if (status === "locked") return "neutral";
  if (status === "completed") return "sun";
  return unitTone;
}

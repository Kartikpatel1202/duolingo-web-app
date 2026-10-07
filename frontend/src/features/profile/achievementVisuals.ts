import {
  Award,
  Book,
  Calendar,
  Crown,
  Flame,
  Footprints,
  Medal,
  Star,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";

import type { Tone } from "@/components/ui";

/** Backend achievement icon keys → icons. Unknown keys fall back to a generic award. */
const ICONS: Record<string, LucideIcon> = {
  footprints: Footprints,
  book: Book,
  bolt: Zap,
  trophy: Trophy,
  flame: Flame,
  calendar: Calendar,
  star: Star,
  crown: Crown,
  medal: Medal,
};

/** Badge colour per metric family, so related achievements look related. */
const METRIC_TONES: Record<string, Tone> = {
  lessons_completed: "leaf",
  total_xp: "sun",
  longest_streak: "ember",
  skills_completed: "grape",
  perfect_lessons: "sky",
};

export function achievementIcon(icon: string): LucideIcon {
  return ICONS[icon] ?? Award;
}

export function achievementTone(metric: string | undefined): Tone {
  return (metric && METRIC_TONES[metric]) || "grape";
}

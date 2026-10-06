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

import { LookupIcon } from "@/components/icons/LookupIcon";
import { ProgressBar } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { ProfileAchievement } from "@/types/api";

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

export function AchievementCard({ achievement }: { achievement: ProfileAchievement }) {
  const earned = achievement.earned_at !== null;
  return (
    <li className="flex items-center gap-4 border-b-2 border-line px-1 py-4 last:border-b-0">
      <span
        className={cn(
          "flex size-16 shrink-0 items-center justify-center rounded-tile shadow-[0_4px_0_var(--tactile-edge)]",
          earned
            ? "bg-grape-500 text-white [--tactile-edge:var(--color-grape-600)]"
            : "bg-locked text-muted [--tactile-edge:var(--color-locked-edge)]",
        )}
        aria-hidden
      >
        <LookupIcon icon={ICONS[achievement.icon] ?? Award} className="size-8" strokeWidth={2.4} />
      </span>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-extrabold text-ink">{achievement.title}</h3>
          <span className="shrink-0 text-sm font-extrabold tabular-nums text-muted">
            {earned ? "Earned" : `${achievement.progress}/${achievement.threshold}`}
          </span>
        </div>
        <p className="text-sm font-semibold text-muted">{achievement.description}</p>
        <ProgressBar
          value={achievement.progress / achievement.threshold}
          tone={earned ? "grape" : "sun"}
          size="sm"
          label={`${achievement.title} progress`}
        />
      </div>
    </li>
  );
}

import { Avatar } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { LeaderboardRow as Row } from "@/types/api";

const MEDALS: Record<number, string> = {
  1: "bg-sun-500 text-white",
  2: "bg-line-strong text-white",
  3: "bg-ember-500 text-white",
};

export function LeaderboardRow({ row, compact = false }: { row: Row; compact?: boolean }) {
  return (
    <li
      aria-current={row.is_current_user ? "true" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-tile px-3",
        compact ? "py-2" : "py-3",
        row.is_current_user ? "bg-sky-50 ring-2 ring-sky-400 ring-inset" : "hover:bg-mist",
      )}
    >
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-black tabular-nums",
          MEDALS[row.rank] ?? "text-muted",
        )}
      >
        {row.rank}
      </span>
      <Avatar name={row.display_name} color={row.avatar_color} size={compact ? "sm" : "md"} />
      <span className={cn("min-w-0 flex-1 truncate font-extrabold", row.is_current_user ? "text-sky-700" : "text-ink")}>
        {row.display_name}
        {row.is_current_user && <span className="sr-only"> (you)</span>}
      </span>
      <span className="shrink-0 font-extrabold tabular-nums text-ink-soft">{row.xp} XP</span>
    </li>
  );
}

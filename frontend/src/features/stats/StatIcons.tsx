import { Flame, Gem, Heart, Zap } from "lucide-react";

import { cn } from "@/lib/cn";

/** Filled, chunky versions of the stat icons so they read at small sizes. */
const base = "size-6 shrink-0";

export function StreakIcon({ lit = true, className }: { lit?: boolean; className?: string }) {
  return (
    <Flame
      className={cn(base, lit ? "text-ember-500" : "text-line-strong", className)}
      fill="currentColor"
      strokeWidth={1.5}
    />
  );
}

export function XpIcon({ className }: { className?: string }) {
  return <Zap className={cn(base, "text-sun-500", className)} fill="currentColor" strokeWidth={1.5} />;
}

export function HeartIcon({ className }: { className?: string }) {
  return <Heart className={cn(base, "text-cherry-500", className)} fill="currentColor" strokeWidth={1.5} />;
}

export function GemIcon({ className }: { className?: string }) {
  return <Gem className={cn(base, "text-sky-500", className)} fill="var(--color-sky-100)" strokeWidth={2.4} />;
}

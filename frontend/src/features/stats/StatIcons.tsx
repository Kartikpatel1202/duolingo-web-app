import { Flame, Gem, Heart, Zap } from "lucide-react";

import { cn } from "@/lib/cn";

/** Filled, chunky versions of the stat icons so they read at small sizes. */
/** Default size, used only when the caller does not pass its own classes. */
const SIZE = "size-6";

export function StreakIcon({ lit = true, className }: { lit?: boolean; className?: string }) {
  return (
    <Flame
      className={cn("shrink-0", lit ? "text-ember-500" : "text-line-strong", className ?? SIZE)}
      fill="currentColor"
      strokeWidth={1.5}
    />
  );
}

export function XpIcon({ className }: { className?: string }) {
  return <Zap className={cn("shrink-0 text-sun-500", className ?? SIZE)} fill="currentColor" strokeWidth={1.5} />;
}

export function HeartIcon({ className }: { className?: string }) {
  return <Heart className={cn("shrink-0 text-cherry-500", className ?? SIZE)} fill="currentColor" strokeWidth={1.5} />;
}

export function GemIcon({ className }: { className?: string }) {
  return <Gem className={cn("shrink-0 text-sky-500", className ?? SIZE)} fill="var(--color-sky-100)" strokeWidth={2.4} />;
}

import type { CSSProperties } from "react";

import { cn } from "@/lib/cn";

interface SkeletonProps {
  className?: string;
  style?: CSSProperties;
  shape?: "block" | "circle" | "text";
}

/** Shimmering placeholder. Give it the size of the content it stands in for (no layout shift). */
export function Skeleton({ className, style, shape = "block" }: SkeletonProps) {
  return (
    <span
      aria-hidden
      style={style}
      className={cn(
        "block animate-shimmer bg-[linear-gradient(90deg,var(--color-line)_0%,var(--color-mist)_50%,var(--color-line)_100%)] bg-[length:200%_100%]",
        shape === "circle" && "rounded-full",
        shape === "block" && "rounded-tile",
        shape === "text" && "h-4 rounded-full",
        className,
      )}
    />
  );
}

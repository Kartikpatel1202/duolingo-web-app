import { cn } from "@/lib/cn";

import { TONE_SOLID, toTone } from "./tones";

interface AvatarProps {
  name: string;
  /** Backend avatar colour name (leaf, sky, …). */
  color: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZES = {
  sm: "size-9 text-sm",
  md: "size-11 text-base",
  lg: "size-16 text-2xl",
  xl: "size-24 text-4xl",
} as const;

export function Avatar({ name, color, size = "md", className }: AvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-black text-white",
        "shadow-[inset_0_-4px_0_rgb(0_0_0/0.12)]",
        TONE_SOLID[toTone(color)],
        SIZES[size],
        className,
      )}
    >
      {initial}
    </span>
  );
}

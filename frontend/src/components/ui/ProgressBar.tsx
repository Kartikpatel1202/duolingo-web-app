"use client";

import { motion } from "motion/react";

import { cn } from "@/lib/cn";

import { TONE_SOLID, type Tone } from "./tones";

interface ProgressBarProps {
  /** 0 – 1 */
  value: number;
  tone?: Tone;
  label: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const HEIGHTS = { sm: "h-2.5", md: "h-4", lg: "h-5" } as const;

/** Thick rounded bar with a glossy highlight, like a game progress meter. */
export function ProgressBar({ value, tone = "leaf", label, size = "md", className }: ProgressBarProps) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className={cn("relative w-full overflow-hidden rounded-full bg-line", HEIGHTS[size], className)}
    >
      <motion.div
        className={cn("relative h-full rounded-full", TONE_SOLID[tone])}
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ type: "spring", stiffness: 140, damping: 22 }}
      >
        {percent > 0 && (
          <span className="absolute inset-x-2 top-1/4 h-1/4 min-h-0.5 rounded-full bg-white/35" aria-hidden />
        )}
      </motion.div>
    </div>
  );
}

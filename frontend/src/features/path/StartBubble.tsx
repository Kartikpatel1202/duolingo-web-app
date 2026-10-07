"use client";

import { motion } from "motion/react";

import { TONE_TEXT, type Tone } from "@/components/ui";
import { cn } from "@/lib/cn";

/** Bouncing call-out above the learner's current skill. The only looping animation on the path. */
export function StartBubble({ label, tone, compact = false }: { label: string; tone: Tone; compact?: boolean }) {
  return (
    <motion.span
      aria-hidden
      className={cn(
        "pointer-events-none absolute bottom-full left-1/2 z-10 -translate-x-1/2",
        compact ? "mb-2" : "mb-3",
      )}
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
    >
      <span
        className={cn(
          "relative block rounded-tile border-2 border-line bg-surface px-4 py-2 text-[15px] font-black tracking-wide whitespace-nowrap uppercase",
          TONE_TEXT[tone],
        )}
      >
        {label}
        <span className="absolute top-full left-1/2 -mt-[3px] size-3 -translate-x-1/2 rotate-45 border-r-2 border-b-2 border-line bg-surface" />
      </span>
    </motion.span>
  );
}

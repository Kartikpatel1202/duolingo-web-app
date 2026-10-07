"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type RewardTone = "sun" | "leaf" | "ember" | "grape";

const TONES: Record<RewardTone, { frame: string; text: string }> = {
  sun: { frame: "border-sun-500 bg-sun-500", text: "text-sun-600" },
  leaf: { frame: "border-leaf-500 bg-leaf-500", text: "text-leaf-600" },
  ember: { frame: "border-ember-500 bg-ember-500", text: "text-ember-600" },
  grape: { frame: "border-grape-500 bg-grape-500", text: "text-grape-600" },
};

interface RewardTileProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  tone: RewardTone;
  /** Stagger position. */
  order: number;
}

/** Coloured frame with a label strip — the end-of-lesson stat cards. */
export function RewardTile({ label, value, icon, tone, order }: RewardTileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.25 + order * 0.15 }}
      className={cn("min-w-0 flex-1 rounded-card border-2 p-0.5", TONES[tone].frame)}
    >
      <p className="py-1 text-label font-black uppercase text-white">{label}</p>
      <div className={cn("flex items-center justify-center gap-1.5 rounded-tile bg-surface px-2 py-3 text-2xl font-black tabular-nums", TONES[tone].text)}>
        <span aria-hidden className="inline-flex">
          {icon}
        </span>
        {value}
      </div>
    </motion.div>
  );
}

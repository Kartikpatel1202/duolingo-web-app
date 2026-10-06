"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

import { Pill, type Tone } from "@/components/ui";
import { useValueChange } from "@/hooks/useValueChange";
import { formatCount } from "@/lib/format";
import { statChange, type StatChangeAnimation } from "@/lib/motion";

interface AnimatedStatProps {
  value: number;
  icon: ReactNode;
  tone: Tone;
  label: string;
  /** Emphasis when the value goes up / down (none on first render). */
  onIncrease?: StatChangeAnimation;
  onDecrease?: StatChangeAnimation;
}

/** A stat pill that briefly reacts when its value changes (bounce for XP, shake for hearts…). */
export function AnimatedStat({ value, icon, tone, label, onIncrease, onDecrease }: AnimatedStatProps) {
  const change = useValueChange(value);
  const animation = change.direction > 0 ? onIncrease : change.direction < 0 ? onDecrease : undefined;
  return (
    <motion.span
      key={change.version}
      className="inline-flex"
      animate={change.version > 0 && animation ? statChange[animation] : undefined}
    >
      <Pill icon={icon} tone={tone} label={label}>
        {formatCount(value)}
      </Pill>
    </motion.span>
  );
}

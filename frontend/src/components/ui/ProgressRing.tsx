"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

interface ProgressRingProps {
  /** 0 – 1 */
  value: number;
  size: number;
  strokeWidth?: number;
  color: string;
  trackColor?: string;
  children?: ReactNode;
  className?: string;
}

/** Circular progress (animates from empty on mount and between values). */
export function ProgressRing({
  value,
  size,
  strokeWidth = 8,
  color,
  trackColor = "var(--color-line)",
  children,
  className,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, value));

  return (
    <span className={className} style={{ position: "relative", width: size, height: size, display: "inline-block" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - clamped) }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      {children && <span className="absolute inset-0 flex items-center justify-center">{children}</span>}
    </span>
  );
}

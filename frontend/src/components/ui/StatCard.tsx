import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import { TONE_TEXT, type Tone } from "./tones";

interface StatCardProps {
  icon: ReactNode;
  tone: Tone;
  value: ReactNode;
  label: string;
  className?: string;
}

export function StatCard({ icon, tone, value, label, className }: StatCardProps) {
  return (
    <div className={cn("flex items-center gap-3 rounded-card border-2 border-line bg-surface p-4", className)}>
      <span className={cn("shrink-0", TONE_TEXT[tone])} aria-hidden>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-heading font-extrabold tabular-nums text-ink">{value}</p>
        <p className="text-sm leading-tight font-bold text-muted">{label}</p>
      </div>
    </div>
  );
}

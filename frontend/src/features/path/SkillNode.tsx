"use client";

import { Check, Crown, Lock } from "lucide-react";
import { motion } from "motion/react";
import { memo } from "react";

import { LookupIcon } from "@/components/icons/LookupIcon";
import { ProgressRing, TONE_COLOR, type Tone } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { PathSkill } from "@/types/api";

import type { PathPoint } from "./pathLayout";
import { NODE_FILL, nodeTone, skillAccessibleName, skillIcon } from "./skillPresentation";
import { StartBubble } from "./StartBubble";

const RING_SIZE = 100;
const RING_STROKE = 8;

interface SkillNodeProps {
  skill: PathSkill;
  unitTone: Tone;
  point: PathPoint;
  isCurrent: boolean;
  /** Position within its unit, for a light entrance stagger. */
  order: number;
  onSelect: (skillId: number) => void;
}

function SkillNodeComponent({ skill, unitTone, point, isCurrent, order, onSelect }: SkillNodeProps) {
  const { status } = skill;
  const tone = nodeTone(status, unitTone);
  const locked = status === "locked";
  const showRing = !locked;
  // Labels sit beside the node, on the side facing the centre, so they never collide with the
  // START bubble or the connectors above and below.
  const labelOnRight = point.x <= 0.5;

  return (
    <div
      className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
      style={{ left: `${point.x * 100}%`, top: point.y }}
      data-current-skill={isCurrent || undefined}
    >
      <motion.div
        className="relative"
        initial={{ opacity: 0, scale: 0.6 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "0px 0px -40px 0px" }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: order * 0.06 }}
      >
        <div className="relative">
          {isCurrent && <StartBubble label={skill.lessons_completed > 0 ? "Continue" : "Start"} tone={unitTone} />}
          <ProgressRing
            value={skill.progress}
            size={RING_SIZE}
            strokeWidth={RING_STROKE}
            color={showRing ? TONE_COLOR[tone] : "transparent"}
            trackColor={showRing ? "var(--color-line)" : "transparent"}
          >
            <button
              type="button"
              onClick={() => onSelect(skill.id)}
              aria-label={skillAccessibleName(skill)}
              aria-haspopup="dialog"
              data-status={status}
              className={cn(
                "tactile focus-ring flex size-[74px] items-center justify-center rounded-full [--tactile-depth:6px]",
                NODE_FILL[tone],
                locked ? "text-muted" : "text-white",
              )}
            >
              <LookupIcon icon={skillIcon(skill.icon)} className="size-9" strokeWidth={2.6} aria-hidden />
            </button>
          </ProgressRing>
          <NodeBadge status={status} />
        </div>
        <span
          className={cn(
            "absolute top-1/2 max-w-32 -translate-y-1/2 truncate rounded-full border-2 border-line bg-white px-3 py-1 text-sm font-extrabold sm:max-w-40",
            labelOnRight ? "left-full ml-2" : "right-full mr-2",
            locked ? "text-muted" : "text-ink-soft",
          )}
          aria-hidden
        >
          {skill.title}
          {status === "in_progress" && (
            <span className="ml-1.5 text-muted tabular-nums">
              {skill.lessons_completed}/{skill.total_lessons}
            </span>
          )}
        </span>
      </motion.div>
    </div>
  );
}

/** Small corner medallion: crown for completed, padlock for locked, check for in-progress lessons. */
function NodeBadge({ status }: { status: PathSkill["status"] }) {
  if (status === "available") return null;
  const styles = {
    completed: { className: "bg-sun-500 text-white border-white", icon: <Crown className="size-4" fill="currentColor" /> },
    locked: { className: "bg-white text-muted border-line", icon: <Lock className="size-4" strokeWidth={3} /> },
    in_progress: { className: "bg-leaf-500 text-white border-white", icon: <Check className="size-4" strokeWidth={4} /> },
  }[status];
  return (
    <span
      aria-hidden
      className={cn(
        "absolute top-1 right-1 flex size-8 items-center justify-center rounded-full border-[3px]",
        styles.className,
      )}
    >
      {styles.icon}
    </span>
  );
}

export const SkillNode = memo(SkillNodeComponent);

"use client";

import { Check, Crown, FastForward, Lock } from "lucide-react";
import { motion } from "motion/react";
import { memo } from "react";

import { LookupIcon } from "@/components/icons/LookupIcon";
import {
  ProgressRing,
  TONE_COLOR,
  TONE_TEXT,
  type Tone,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import type { PathSkill } from "@/types/api";

import type { PathPoint } from "./pathLayout";
import {
  NODE_FILL,
  nodeTone,
  skillAccessibleName,
  skillIcon,
} from "./skillPresentation";
import { StartBubble } from "./StartBubble";
import { CoinNode } from "./CoinNode";
import type { UnitArt } from "./unitArt";

const RING_SIZE = 100;
const RING_STROKE = 8;

interface SkillNodeProps {
  skill: PathSkill;
  unitTone: Tone;
  point: PathPoint;
  isCurrent: boolean;
  /** First skill of a unit the learner has not reached: shown as the unit's "Jump here?" entry. */
  jump: boolean;
  /** Position within its unit, for a light entrance stagger. */
  order: number;
  /** The unit's own look: when present, skills are drawn as coins (see `CoinNode`). */
  art?: UnitArt;
  onSelect: (skillId: number) => void;
  onJump: () => void;
}

function SkillNodeComponent({
  skill,
  unitTone,
  point,
  isCurrent,
  jump,
  order,
  art,
  onSelect,
  onJump,
}: SkillNodeProps) {
  const { status } = skill;
  // A jump node keeps its unit's colour so every unit announces itself, even while locked.
  const tone = jump ? unitTone : nodeTone(status, unitTone, skill.legendary);
  const locked = status === "locked";
  const showRing = !locked;
  // The name appears beside the node on hover or keyboard focus, on the side facing the centre.
  const labelOnRight = point.x <= 0.5;

  return (
    <div
      className="group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
      style={{ left: `${point.x * 100}%`, top: point.y }}
      data-current-skill={isCurrent || undefined}
    >
      <motion.div
        className="relative"
        initial={{ opacity: 0, scale: 0.6 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "0px 0px -40px 0px" }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: order * 0.06,
        }}
      >
        <motion.div
          className="relative"
          // Unlocked and jump nodes swell slightly under the pointer; locked ones shake their head.
          whileHover={
            locked && !jump ? { rotate: [0, -4, 4, -2, 0] } : { scale: 1.06 }
          }
          transition={
            locked && !jump
              ? { duration: 0.4 }
              : { type: "spring", stiffness: 400, damping: 18 }
          }
        >
          {isCurrent && !art && (
            <span
              aria-hidden
              className="node-breathe pointer-events-none absolute inset-1 rounded-full"
              style={{ backgroundColor: TONE_COLOR[tone] }}
            />
          )}
          {isCurrent && (
            <StartBubble
              label={skill.lessons_completed > 0 ? "Continue" : "Start"}
              tone={unitTone}
              compact={Boolean(art)}
            />
          )}
          {jump && <JumpBubble tone={unitTone} />}
          {art ? (
            <div className="relative flex h-[72px] w-[100px] items-center justify-center">
              <CoinNode
                skill={skill}
                tone={tone}
                isCurrent={isCurrent}
                jump={jump}
                art={art}
                onPress={() => (jump ? onJump() : onSelect(skill.id))}
              />
              <NodeBadge status={jump ? "available" : status} legendary={skill.legendary} coin />
            </div>
          ) : (
            <ProgressRing
              value={skill.progress}
              size={RING_SIZE}
              strokeWidth={RING_STROKE}
              color={showRing ? TONE_COLOR[tone] : "transparent"}
              trackColor={showRing ? "var(--color-line)" : "transparent"}
            >
              <button
                type="button"
                onClick={() => (jump ? onJump() : onSelect(skill.id))}
                aria-label={skillAccessibleName(skill)}
                aria-haspopup="dialog"
                data-status={status}
                data-jump={jump || undefined}
                className={cn(
                  "tactile focus-ring flex size-[74px] items-center justify-center rounded-full [--tactile-depth:6px]",
                  NODE_FILL[tone],
                  locked && !jump ? "text-muted" : "text-white",
                )}
              >
                {jump ? (
                  <FastForward
                    className="size-9"
                    fill="currentColor"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                ) : (
                  <LookupIcon
                    icon={skillIcon(skill.icon)}
                    className="size-9"
                    strokeWidth={2.6}
                    aria-hidden
                  />
                )}
              </button>
            </ProgressRing>
          )}
          {!jump && !art && (
            <NodeBadge status={status} legendary={skill.legendary} />
          )}
        </motion.div>
        <span
          className={cn(
            "pointer-events-none absolute top-1/2 z-10 max-w-40 -translate-y-1/2 truncate rounded-full border-2 border-line bg-surface px-3 py-1 text-sm font-extrabold",
            "opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100",
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

/** Static call-out above a unit's first node while that unit is still ahead of the learner. */
function JumpBubble({ tone }: { tone: Tone }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2"
    >
      <span
        className={cn(
          "relative block rounded-tile border-2 border-line bg-surface px-3.5 py-1.5 text-[14px] font-black tracking-wide whitespace-nowrap uppercase",
          TONE_TEXT[tone],
        )}
      >
        Jump here?
        <span className="absolute top-full left-1/2 -mt-[3px] size-3 -translate-x-1/2 rotate-45 border-r-2 border-b-2 border-line bg-surface" />
      </span>
    </span>
  );
}

/** Small corner medallion: crown for completed, padlock for locked, check for in-progress lessons. */
function NodeBadge({
  status,
  legendary,
  coin = false,
}: {
  status: PathSkill["status"];
  legendary: boolean;
  coin?: boolean;
}) {
  // Coin nodes show their lock in the artwork itself, and available ones need no medallion.
  if (status === "available" || (coin && status === "locked")) return null;
  const styles = {
    completed: {
      className: legendary
        ? "bg-grape-500 text-white border-surface"
        : "bg-sun-500 text-white border-surface",
      icon: <Crown className="size-4" fill="currentColor" />,
    },
    locked: {
      className: "bg-surface text-muted border-line",
      icon: <Lock className="size-4" strokeWidth={3} />,
    },
    in_progress: {
      className: "bg-leaf-500 text-white border-surface",
      icon: <Check className="size-4" strokeWidth={4} />,
    },
  }[status];
  return (
    <motion.span
      aria-hidden
      // The medallion pops in after its node, so completion reads as a small reward.
      initial={{ scale: 0, rotate: -30 }}
      whileInView={{ scale: 1, rotate: 0 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 420, damping: 14, delay: 0.25 }}
      className={cn(
        "absolute flex size-8 items-center justify-center rounded-full border-[3px]",
        coin ? "top-0 right-1" : "top-1 right-1",
        styles.className,
      )}
    >
      {styles.icon}
    </motion.span>
  );
}

export const SkillNode = memo(SkillNodeComponent);

"use client";

import { useMemo } from "react";

import { TONE_COLOR, type Tone } from "@/components/ui";
import type { PathSkill } from "@/types/api";

import { connectorPath, layoutPath } from "./pathLayout";
import { SkillNode } from "./SkillNode";

interface PathTrackProps {
  skills: PathSkill[];
  unitTone: Tone;
  /** Index of the first skill within the whole course (keeps the wave continuous). */
  firstGlobalIndex: number;
  currentSkillId: number | null;
  onSelect: (skillId: number) => void;
}

/** One unit's winding run of skill nodes, joined by curved connectors. */
export function PathTrack({ skills, unitTone, firstGlobalIndex, currentSkillId, onSelect }: PathTrackProps) {
  const { points, height } = useMemo(
    () => layoutPath(skills.length, firstGlobalIndex),
    [skills.length, firstGlobalIndex],
  );

  return (
    <div className="relative mx-auto w-full max-w-[560px]" style={{ height }}>
      <svg
        className="absolute inset-0 h-full w-full overflow-visible"
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        aria-hidden
      >
        {points.slice(1).map((to, i) => {
          const from = points[i]!;
          // A connector is "travelled" once the skill it leaves from is completed.
          const travelled = skills[i]?.status === "completed";
          return (
            <path
              key={i}
              d={connectorPath(from, to)}
              fill="none"
              stroke={travelled ? TONE_COLOR[unitTone] : "var(--color-line)"}
              strokeOpacity={travelled ? 0.45 : 1}
              strokeWidth={14}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>
      <ol className="contents">
        {skills.map((skill, i) => (
          <li key={skill.id} className="contents">
            <SkillNode
              skill={skill}
              unitTone={unitTone}
              point={points[i]!}
              isCurrent={skill.id === currentSkillId}
              order={i}
              onSelect={onSelect}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}

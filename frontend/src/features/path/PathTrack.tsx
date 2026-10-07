"use client";

import { AnimatePresence } from "motion/react";
import { useMemo } from "react";

import { TONE_COLOR, type Tone } from "@/components/ui";
import type { PathSkill, UnitChest } from "@/types/api";

import { ChestNode } from "./ChestNode";
import { LessonIntro } from "./LessonIntro";
import { CharacterDecoration, PathCharacter } from "./PathCharacter";
import {
  connectorPath,
  layoutFixed,
  layoutPath,
  type PathPoint,
} from "./pathLayout";
import { SkillNode } from "./SkillNode";
import { TrophyNode } from "./TrophyNode";
import { charactersBeside, introCardLayout, trackItems, type UnitArt } from "./unitArt";

/** Characters per unit on the default path; each stands in a gap between two nodes. */
export const CHARACTERS_PER_UNIT = 2;

interface PathTrackProps {
  unitId: number;
  unitPosition: number;
  skills: PathSkill[];
  chest: UnitChest;
  unitTone: Tone;
  /** Index of the first skill within the whole course (keeps the wave continuous). */
  firstGlobalIndex: number;
  currentSkillId: number | null;
  /** The unit's own look, when it has one (see `unitArt.ts`). */
  art?: UnitArt;
  unitTitle: string;
  /** The skill whose lesson-intro card is open in this unit, if any. */
  introSkillId: number | null;
  onCloseIntro: () => void;
  onSelect: (skillId: number) => void;
  onJump: () => void;
}

/**
 * Where the default path's characters stand: in the gaps after the first and after the third node
 * (no node sits at those heights), each on the side the connector swings away from.
 */
function characterSpots(
  points: PathPoint[],
): { top: number; side: "left" | "right" }[] {
  return [0, 2].flatMap((index) => {
    const [above, below] = [points[index], points[index + 1]];
    if (!above || !below) return [];
    return [
      {
        top: (above.y + below.y) / 2,
        side:
          (above.x + below.x) / 2 > 0.5
            ? ("left" as const)
            : ("right" as const),
      },
    ];
  });
}

/** One unit's winding run of skill nodes, ending in its treasure chest and trophy. */
export function PathTrack({
  unitId,
  unitPosition,
  skills,
  chest,
  unitTone,
  firstGlobalIndex,
  currentSkillId,
  art,
  unitTitle,
  introSkillId,
  onCloseIntro,
  onSelect,
  onJump,
}: PathTrackProps) {
  const items = useMemo(
    () => trackItems(skills.length, art),
    [skills.length, art],
  );
  const { points, height } = useMemo(
    () =>
      art
        ? layoutFixed(art.xs, art.step)
        : layoutPath(items.length, firstGlobalIndex),
    [art, items.length, firstGlobalIndex],
  );
  const completed = skills.filter(
    (skill) => skill.status === "completed",
  ).length;
  // A unit the learner has not reached: every skill is still locked.
  const unitLocked =
    skills.length > 0 && skills.every((skill) => skill.status === "locked");
  const introSkill = skills.find((skill) => skill.id === introSkillId) ?? null;
  const introPoint = introSkill
    ? points[
        items.findIndex(
          (item) =>
            item.kind === "skill" && skills[item.index]?.id === introSkill.id,
        )
      ]
    : undefined;

  // The card opens just under its node (about 200px tall): it keeps clear of the characters there.
  const introLayout = introCardLayout(
    introPoint ? charactersBeside(art, points, introPoint.y + 56, introPoint.y + 256) : [],
  );

  return (
    // `isolate`: the characters and the lesson card (z-20/30) stay inside the track's own stacking
    // context, so they scroll *under* the sticky unit banner instead of drawing over it.
    <div className="relative isolate mx-auto w-full max-w-[560px]" style={{ height }}>
      <svg
        className="absolute inset-0 h-full w-full overflow-visible"
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        aria-hidden
      >
        {/* Coin-style units have no drawn road: the coins themselves mark the way. */}
        {!art?.coinNodes &&
          points.slice(1).map((to, i) => {
            const from = points[i]!;
            const fromItem = items[i];
            // A connector is "travelled" once the skill it leaves from is completed.
            const travelled =
              fromItem?.kind === "skill" &&
              skills[fromItem.index]?.status === "completed";
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
      {art
        ? art.characters.map((character) => {
            const anchor = points[character.alignedWith];
            return anchor ? (
              <CharacterDecoration
                key={character.src}
                src={unitLocked && character.lockedSrc ? character.lockedSrc : character.src}
                locked={unitLocked && !character.lockedSrc}
                width={character.width}
                height={character.height}
                x={character.x}
                y={anchor.y}
              />
            ) : null;
          })
        : characterSpots(points).map((spot, index) => (
            <PathCharacter
              key={index}
              slot={(unitPosition - 1) * CHARACTERS_PER_UNIT + index}
              locked={unitLocked}
              side={spot.side}
              top={spot.top}
            />
          ))}
      <ol className="contents">
        {items.map((item, position) => {
          const point = points[position];
          if (!point) return null;
          if (item.kind === "chest") {
            return (
              <ChestNode
                key="chest"
                unitId={unitId}
                chest={chest}
                point={point}
                art={art}
              />
            );
          }
          if (item.kind === "trophy") {
            return (
              <TrophyNode
                key="trophy"
                completed={completed}
                total={skills.length}
                point={point}
                art={art}
              />
            );
          }
          const skill = skills[item.index];
          if (!skill) return null;
          return (
            <li key={skill.id} className="contents">
              <SkillNode
                skill={skill}
                unitTone={unitTone}
                point={point}
                isCurrent={skill.id === currentSkillId}
                jump={unitLocked && item.index === 0}
                order={item.index}
                art={art}
                onSelect={onSelect}
                onJump={onJump}
              />
            </li>
          );
        })}
      </ol>
      <AnimatePresence>
        {introSkill && introPoint && (
          // Under the node, on the track's left, over the nodes beneath it (z-30) but ending before
          // the unit's character, which stays visible beside it (z-20).
          <div
            key={introSkill.id}
            className="absolute z-30"
            style={{ top: introPoint.y + 56, ...introLayout }}
          >
            <LessonIntro
              skill={introSkill}
              unitTitle={unitTitle}
              unitTone={unitTone}
              onClose={onCloseIntro}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

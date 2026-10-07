import { toTone } from "@/components/ui";
import type { PathUnit } from "@/types/api";

import { PathTrack } from "./PathTrack";
import { UnitHeader } from "./UnitHeader";
import { UNIT_ART } from "./unitArt";

interface UnitSectionProps {
  unit: PathUnit;
  firstGlobalIndex: number;
  currentSkillId: number | null;
  introSkillId: number | null;
  onCloseIntro: () => void;
  onSelect: (skillId: number) => void;
  onJump: (unitId: number) => void;
  /** The previous unit is drawn with its own look, so it already ends with the chapter break. */
  previousHasArt: boolean;
  /** Title of the unit that follows this one, named in the chapter break below this unit. */
  nextUnitTitle?: string;
}

export function UnitSection({
  unit,
  firstGlobalIndex,
  currentSkillId,
  introSkillId,
  onCloseIntro,
  onSelect,
  onJump,
  previousHasArt,
  nextUnitTitle,
}: UnitSectionProps) {
  const tone = toTone(unit.theme, "leaf");
  const headingId = `unit-${unit.id}-title`;
  const art = UNIT_ART[unit.position];
  return (
    <section aria-labelledby={headingId}>
      {unit.position > 1 && !previousHasArt && <ChapterBreak title={unit.title} className="mb-6" />}
      <UnitHeader unit={unit} tone={tone} headingId={headingId} />
      <PathTrack
        unitId={unit.id}
        unitPosition={unit.position}
        chest={unit.chest}
        skills={unit.skills}
        unitTone={tone}
        firstGlobalIndex={firstGlobalIndex}
        currentSkillId={currentSkillId}
        art={art}
        unitTitle={unit.title}
        introSkillId={introSkillId}
        onCloseIntro={onCloseIntro}
        onSelect={onSelect}
        onJump={() => onJump(unit.id)}
      />
      {art && nextUnitTitle && <ChapterBreak title={nextUnitTitle} className="mt-2" />}
    </section>
  );
}

/** Chapter break between units (decorative: the next banner carries the heading). */
function ChapterBreak({ title, className }: { title: string; className: string }) {
  return (
    <div aria-hidden className={`${className} flex items-center gap-4 text-[17px] font-extrabold text-muted`}>
      <span className="h-0.5 flex-1 rounded-full bg-line" />
      {title}
      <span className="h-0.5 flex-1 rounded-full bg-line" />
    </div>
  );
}

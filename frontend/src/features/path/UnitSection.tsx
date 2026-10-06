import { toTone } from "@/components/ui";
import type { PathUnit } from "@/types/api";

import { PathTrack } from "./PathTrack";
import { UnitHeader } from "./UnitHeader";

interface UnitSectionProps {
  unit: PathUnit;
  firstGlobalIndex: number;
  currentSkillId: number | null;
  onSelect: (skillId: number) => void;
}

export function UnitSection({ unit, firstGlobalIndex, currentSkillId, onSelect }: UnitSectionProps) {
  const tone = toTone(unit.theme, "leaf");
  const headingId = `unit-${unit.id}-title`;
  return (
    <section aria-labelledby={headingId}>
      <UnitHeader unit={unit} tone={tone} headingId={headingId} />
      <PathTrack
        skills={unit.skills}
        unitTone={tone}
        firstGlobalIndex={firstGlobalIndex}
        currentSkillId={currentSkillId}
        onSelect={onSelect}
      />
    </section>
  );
}

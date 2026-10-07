"use client";

import { ArrowLeft, NotebookText } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

import { DuoMascot } from "@/components/illustrations";
import { ButtonLink, ErrorState, Skeleton } from "@/components/ui";
import { useGuidebook } from "@/hooks/api/useCourse";
import { toApiError } from "@/lib/api/errors";
import { UNIT_ART } from "@/features/path/unitArt";
import { languageName } from "@/lib/format";
import type { GuidebookSection } from "@/types/api";

import { SECTION_COMPONENTS, TipGroup } from "./sections";

type SectionEntry = { section: GuidebookSection; headingId: string };

/** Sections in order, with consecutive tips gathered into one group. */
function groupSections(sections: readonly GuidebookSection[]): SectionEntry[][] {
  const groups: SectionEntry[][] = [];
  sections.forEach((section, index) => {
    const entry = { section, headingId: `guidebook-section-${index}` };
    const last = groups[groups.length - 1];
    if (section.kind === "tip" && last?.[0]?.section.kind === "tip") last.push(entry);
    else groups.push([entry]);
  });
  return groups;
}

/** A unit's guidebook: key phrases, vocabulary and tips, all read from the API. */
export function GuidebookView({ unitId }: { unitId: number }) {
  const { data, error, refetch, isFetching } = useGuidebook(unitId);

  return (
    <div className="mx-auto w-full max-w-[592px]">
      <Link
        href="/learn"
        className="focus-ring -ml-2 inline-flex h-11 items-center gap-3 rounded-tile px-2 text-[19px] font-extrabold text-muted hover:text-ink-soft"
      >
        <ArrowLeft className="size-5" strokeWidth={3} aria-hidden />
        Back
      </Link>
      <hr className="mt-2 mb-6 border-t-2 border-line" />

      {error ? (
        toApiError(error).status === 404 ? (
          <NoGuidebook />
        ) : (
          <ErrorState error={error} onRetry={() => void refetch()} retrying={isFetching} />
        )
      ) : !data ? (
        <GuidebookSkeleton />
      ) : (
        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="space-y-9"
        >
          <header className="flex items-center gap-5 border-b-2 border-line pb-6 sm:gap-8">
            <DuoMascot
              state="guidebook"
              src={UNIT_ART[data.unit_position]?.guidebookMascot}
              animated
              className="size-24 shrink-0 sm:size-32"
            />
            <div className="space-y-1.5">
              <h1 className="text-title font-black text-ink">Unit {data.unit_position} Guidebook</h1>
              <p className="font-semibold text-muted">{data.introduction}</p>
            </div>
          </header>
          {groupSections(data.sections).map((group) => {
            const [first] = group;
            if (!first) return null;
            const key = `${first.section.kind}-${first.section.title}`;
            const common = { language: data.language, languageName: languageName(data.language) };
            // Tips that follow each other share one card.
            if (first.section.kind === "tip") {
              return <TipGroup key={key} tips={group} {...common} />;
            }
            const Section = SECTION_COMPONENTS[first.section.kind];
            return <Section key={key} section={first.section} headingId={first.headingId} {...common} />;
          })}
          <ButtonLink href="/learn" fullWidth size="lg">
            Back to the path
          </ButtonLink>
        </motion.article>
      )}
    </div>
  );
}

function NoGuidebook() {
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <span className="flex size-20 items-center justify-center rounded-full bg-mist text-muted" aria-hidden>
        <NotebookText className="size-10" strokeWidth={2.4} />
      </span>
      <h1 className="text-title font-black text-ink">No guidebook yet</h1>
      <p className="font-semibold text-muted">This unit does not have a guidebook. Head back to keep learning.</p>
      <ButtonLink href="/learn">Back to the path</ButtonLink>
    </div>
  );
}

function GuidebookSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading the guidebook">
      <div className="flex items-center gap-6">
        <Skeleton shape="circle" className="size-24" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-5 w-full" />
        </div>
      </div>
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-20 w-3/4 rounded-card" />
      ))}
      <Skeleton className="h-64 w-full rounded-panel" />
    </div>
  );
}

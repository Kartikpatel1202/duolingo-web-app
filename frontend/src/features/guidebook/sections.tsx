import type { ComponentType, ReactNode } from "react";

import { AudioButton } from "@/components/ui";
import type { GuidebookSection } from "@/types/api";

import { Highlighted, highlightTerms } from "./Highlighted";
import { PhraseCard } from "./PhraseCard";

export interface SectionProps {
  section: GuidebookSection;
  /** BCP-47 code of the language being learned (drives audio and `lang`). */
  language: string;
  /** Display name of that language, for table headings. */
  languageName: string;
  headingId: string;
}

/** Key phrases and vocabulary: a list of speakable bubbles under a small coloured heading. */
function PhraseSection({ section, language, headingId }: SectionProps) {
  return (
    <section aria-labelledby={headingId} className="space-y-4">
      <h2 id={headingId} className="text-[15px] font-black uppercase tracking-wide text-sky-500">
        {section.title}
      </h2>
      <ul className="flex flex-col gap-5 pl-2">
        {section.entries.map((entry) => (
          <PhraseCard key={entry.text} entry={entry} language={language} />
        ))}
      </ul>
    </section>
  );
}

type TipParts = Record<"table" | "footer" | "examples", ReactNode>;

/** How each `layout` orders a tip's parts after its explanation. */
const TIP_ORDER: Record<GuidebookSection["layout"], (parts: TipParts) => ReactNode[]> = {
  default: ({ table, footer, examples }) => [table, footer, examples],
  examples_first: ({ table, footer, examples }) => [examples, footer, table],
  footer_last: ({ table, footer, examples }) => [table, examples, footer],
};

/**
 * The tip's content: explanation, then (by default) a two-column table, a closing note and the
 * examples; the tip's `layout` can reorder them (examples first, or note last).
 */
function TipBody({ section, language, languageName, headingId, first }: SectionProps & { first: boolean }) {
  const terms = section.entries.filter((entry) => entry.kind === "term");
  const examples = section.entries.filter((entry) => entry.kind !== "term");
  // Accent the unit's chosen words, or (by default) the table's first-column words.
  const accented = section.highlights.length
    ? section.highlights
    : highlightTerms(terms.map((entry) => entry.text));

  const table = terms.length > 0 && (
    <div key="table" className="overflow-hidden rounded-card border-2 border-sky-100 bg-surface">
      <table className="w-full table-fixed border-collapse text-left">
        <thead className="bg-sky-100 text-ink">
          <tr>
            <th scope="col" className="px-4 py-3 font-extrabold">
              {section.term_heading ?? languageName}
            </th>
            <th scope="col" className="border-l-2 border-sky-100 px-4 py-3 font-extrabold">
              {section.translation_heading ?? "English"}
            </th>
          </tr>
        </thead>
        <tbody>
          {terms.map((entry) => (
            <tr key={entry.text} className="border-t-2 border-sky-100">
              <td lang={language} className="px-4 py-3 font-extrabold text-sky-600">
                {section.highlights.length ? <Highlighted text={entry.text} terms={accented} /> : entry.text}
              </td>
              <td className="border-l-2 border-sky-100 px-4 py-3 font-semibold text-ink-soft">
                {entry.translation}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  const footer = section.footer && (
    <p key="footer" className="font-semibold text-ink-soft">
      <Highlighted text={section.footer} terms={accented} />
    </p>
  );
  const exampleList = examples.length > 0 && (
    <ul key="examples" className="flex flex-col gap-3" aria-label="Examples">
      {examples.map((entry) => (
        <li key={entry.text} className="flex items-start gap-1">
          <AudioButton text={entry.text} language={language} variant="plain" />
          <div className="py-1.5">
            <p lang={language} className="font-bold text-ink">
              <Highlighted text={entry.text} terms={accented} />
            </p>
            <p className="mt-1 font-semibold text-muted">{entry.translation}</p>
          </div>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        {first && <p className="text-[13px] font-black uppercase tracking-wide text-sky-500">Tip</p>}
        <h2 id={headingId} className="text-heading font-extrabold text-ink">
          {section.title}
        </h2>
      </div>
      {section.body && (
        <p className="font-semibold text-ink-soft">
          <Highlighted text={section.body} terms={accented} />
        </p>
      )}
      {TIP_ORDER[section.layout]({ table, footer, examples: exampleList })}
    </div>
  );
}

/** A grammar or pronunciation tip in its own light-blue card. */
function TipSection(props: SectionProps) {
  return <TipGroup language={props.language} languageName={props.languageName} tips={[props]} />;
}

/**
 * One light-blue card holding one or more tips, separated by space: tips that follow each other
 * in a guidebook read as parts of the same box, and only the first carries the "Tip" label.
 */
export function TipGroup({
  tips,
  language,
  languageName,
}: Pick<SectionProps, "language" | "languageName"> & {
  tips: readonly Pick<SectionProps, "section" | "headingId">[];
}) {
  const first = tips[0];
  if (!first) return null;
  return (
    <section aria-labelledby={first.headingId} className="space-y-8 rounded-panel bg-sky-50 p-5 sm:p-6">
      {tips.map((tip, index) => (
        <TipBody
          key={tip.headingId}
          section={tip.section}
          headingId={tip.headingId}
          language={language}
          languageName={languageName}
          first={index === 0}
        />
      ))}
    </section>
  );
}

/**
 * Section kind → renderer. The mapped type makes this exhaustive: a new kind in the API contract
 * fails the type check here until it has a component.
 */
export const SECTION_COMPONENTS: { [Kind in GuidebookSection["kind"]]: ComponentType<SectionProps> } = {
  key_phrases: PhraseSection,
  vocabulary: PhraseSection,
  tip: TipSection,
};

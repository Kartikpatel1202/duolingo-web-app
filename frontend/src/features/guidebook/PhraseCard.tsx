import { AudioButton } from "@/components/ui";
import type { GuidebookEntry } from "@/types/api";

/** A phrase in a speech bubble: tap the speaker to hear it, with the translation underneath. */
export function PhraseCard({ entry, language }: { entry: GuidebookEntry; language: string }) {
  return (
    <li className="relative w-fit max-w-full rounded-card border-2 border-line bg-surface py-2 pr-5 pl-2 transition-colors hover:bg-mist">
      {/* Bubble tail */}
      <span
        aria-hidden
        className="absolute top-6 -left-[7px] size-3 rotate-45 border-b-2 border-l-2 border-line bg-inherit"
      />
      <div className="flex items-start gap-1">
        <AudioButton text={entry.text} language={language} variant="plain" />
        <div className="min-w-0 py-1.5">
          <p lang={language} className="font-bold text-ink underline decoration-line-strong decoration-dashed underline-offset-[6px]">
            {entry.text}
          </p>
          <p className="mt-1.5 font-semibold text-muted">{entry.translation}</p>
        </div>
      </div>
    </li>
  );
}

import type { ReactNode } from "react";

/** Words in a tip's table that should stand out wherever they appear in its text. */
export function highlightTerms(terms: readonly string[]): string[] {
  const words = terms.flatMap((term) => term.split(" / "));
  // Only plain words and short phrases: punctuation would make the match ambiguous.
  return words.map((word) => word.trim()).filter((word) => word.length > 0 && /^[\p{L} ]+$/u.test(word));
}

interface HighlightedProps {
  text: string;
  terms: readonly string[];
}

/**
 * Text with the given terms picked out in the tip's accent colour (whole words only, so the "o"
 * in "como" is left alone). With no terms it is just the text.
 */
export function Highlighted({ text, terms }: HighlightedProps) {
  if (terms.length === 0) return <>{text}</>;
  const pattern = [...terms]
    .sort((a, b) => b.length - a.length)
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const parts = text.split(new RegExp(`(?<![\\p{L}])(${pattern})(?![\\p{L}])`, "u"));
  const accent = new Set(terms);
  return (
    <>
      {parts.map(
        (part, index): ReactNode =>
          // split() puts every match at an odd index
          index % 2 === 1 && accent.has(part) ? (
            <span key={index} className="font-extrabold text-sky-500">
              {part}
            </span>
          ) : (
            part
          ),
      )}
    </>
  );
}

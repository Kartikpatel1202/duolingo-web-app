import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface CourseFlagProps {
  /** BCP-47 language code from the course (e.g. "es"). */
  language: string;
  className?: string;
}

/** Simplified flag drawings on a 36×28 tile, with the language name for assistive technology. */
const FLAGS: Record<string, { name: string; art: ReactNode }> = {
  es: {
    name: "Spanish",
    art: (
      <>
        <rect width="36" height="28" fill="#c8102e" />
        <rect y="7" width="36" height="14" fill="#ffc400" />
        <rect x="8" y="10" width="5" height="8" rx="1.5" fill="#c8102e" opacity="0.65" />
      </>
    ),
  },
  en: {
    name: "English",
    art: (
      <>
        <rect width="36" height="28" fill="#ffffff" />
        {[0, 8, 16, 24].map((y) => (
          <rect key={y} y={y} width="36" height="4" fill="#e5484d" />
        ))}
        <rect width="16" height="14" fill="#1c64f2" />
      </>
    ),
  },
  fr: {
    name: "French",
    art: (
      <>
        <rect width="36" height="28" fill="#ffffff" />
        <rect width="12" height="28" fill="#1c64f2" />
        <rect x="24" width="12" height="28" fill="#e5484d" />
      </>
    ),
  },
  de: {
    name: "German",
    art: (
      <>
        <rect width="36" height="28" fill="#ffc400" />
        <rect width="36" height="19" fill="#e5484d" />
        <rect width="36" height="9.5" fill="#1f2a30" />
      </>
    ),
  },
  it: {
    name: "Italian",
    art: (
      <>
        <rect width="36" height="28" fill="#ffffff" />
        <rect width="12" height="28" fill="#2f9e44" />
        <rect x="24" width="12" height="28" fill="#e5484d" />
      </>
    ),
  },
  pt: {
    name: "Portuguese",
    art: (
      <>
        <rect width="36" height="28" fill="#2f9e44" />
        <path d="M18 4 32 14 18 24 4 14Z" fill="#ffc400" />
        <circle cx="18" cy="14" r="5" fill="#1c64f2" />
      </>
    ),
  },
};

/**
 * Original, simplified flag tiles drawn as SVG. Unknown languages fall back to a neutral tile with
 * the language code, so a new course never renders a broken image.
 */
export function CourseFlag({ language, className }: CourseFlagProps) {
  const common = cn("h-7 w-9 shrink-0 overflow-hidden rounded-md border-2 border-line", className);
  const flag = FLAGS[language];
  if (flag) {
    return (
      <svg viewBox="0 0 36 28" className={common} role="img" aria-label={flag.name}>
        {flag.art}
      </svg>
    );
  }
  return (
    <span className={cn(common, "inline-flex items-center justify-center bg-sky-100 text-xs font-black uppercase text-sky-700")}>
      {language}
    </span>
  );
}

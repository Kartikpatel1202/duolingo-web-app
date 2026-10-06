import { cn } from "@/lib/cn";

interface CourseFlagProps {
  /** BCP-47 language code from the course (e.g. "es"). */
  language: string;
  className?: string;
}

/**
 * Original, simplified flag tiles drawn as SVG. Unknown languages fall back to a neutral tile with
 * the language code, so a new course never renders a broken image.
 */
export function CourseFlag({ language, className }: CourseFlagProps) {
  const common = cn("h-7 w-9 shrink-0 overflow-hidden rounded-md border-2 border-line", className);
  if (language === "es") {
    return (
      <svg viewBox="0 0 36 28" className={common} role="img" aria-label="Spanish">
        <rect width="36" height="28" fill="#c8102e" />
        <rect y="7" width="36" height="14" fill="#ffc400" />
        <rect x="8" y="10" width="5" height="8" rx="1.5" fill="#c8102e" opacity="0.65" />
      </svg>
    );
  }
  return (
    <span className={cn(common, "inline-flex items-center justify-center bg-sky-100 text-xs font-black uppercase text-sky-700")}>
      {language}
    </span>
  );
}

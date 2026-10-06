import { cn } from "@/lib/cn";

/** Original wordmark + bubble mark. `compact` shows only the mark (icon rail). */
export function BrandLogo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg viewBox="0 0 40 40" className="size-10 shrink-0" aria-hidden>
        <path
          d="M20 3c9.4 0 17 6.6 17 15.2S29.4 33.4 20 33.4c-1.6 0-3.1-.2-4.6-.6L8.3 37c-1 .6-2.2-.3-1.9-1.4l1.5-5.6C4.9 27.4 3 23.2 3 18.2 3 9.6 10.6 3 20 3Z"
          fill="var(--color-leaf-500)"
        />
        <circle cx="14" cy="18" r="3.2" fill="white" />
        <circle cx="26" cy="18" r="3.2" fill="white" />
        <circle cx="14.6" cy="18.4" r="1.5" fill="var(--color-ink)" />
        <circle cx="26.6" cy="18.4" r="1.5" fill="var(--color-ink)" />
        <path d="M16 25c2.4 2 5.6 2 8 0" stroke="white" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      </svg>
      {!compact && <span className="text-[28px] font-black tracking-tight text-leaf-500">lingo</span>}
    </span>
  );
}

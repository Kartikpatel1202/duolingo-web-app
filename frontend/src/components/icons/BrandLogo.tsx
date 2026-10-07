import Image from "next/image";

import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/cn";

interface BrandLogoProps {
  /** Only the mark (icon rail). */
  compact?: boolean;
  /** Use the landing page's logo file when one is configured. */
  landing?: boolean;
  /** Just the wordmark, without the mark beside it (the signed-in sidebar). */
  wordmarkOnly?: boolean;
  className?: string;
}

/**
 * The product logo, everywhere it appears. It renders the logo file configured in `lib/brand.ts`
 * (height-locked, width from the file's own proportions, so it is never stretched) or the
 * built-in placeholder mark while none is supplied.
 */
export function BrandLogo({
  compact = false,
  landing = false,
  wordmarkOnly = false,
  className,
}: BrandLogoProps) {
  const supplied = compact
    ? BRAND.markSrc
    : ((landing ? BRAND.landingLogoSrc : null) ?? BRAND.logoSrc);
  if (supplied) {
    return (
      <Image
        src={supplied}
        alt={BRAND.name}
        width={compact ? 40 : 160}
        height={40}
        unoptimized
        priority
        className={cn("h-10 w-auto max-w-full", className)}
      />
    );
  }
  return (
    <span
      className={cn("inline-flex items-center gap-2", className)}
      data-brand-placeholder
    >
      {!wordmarkOnly && (
        <svg viewBox="0 0 40 40" className="size-10 shrink-0" aria-hidden>
          <path
            d="M20 3c9.4 0 17 6.6 17 15.2S29.4 33.4 20 33.4c-1.6 0-3.1-.2-4.6-.6L8.3 37c-1 .6-2.2-.3-1.9-1.4l1.5-5.6C4.9 27.4 3 23.2 3 18.2 3 9.6 10.6 3 20 3Z"
            fill="var(--color-leaf-500)"
          />
          <circle cx="14" cy="18" r="3.2" fill="white" />
          <circle cx="26" cy="18" r="3.2" fill="white" />
          <circle cx="14.6" cy="18.4" r="1.5" fill="#1f2a30" />
          <circle cx="26.6" cy="18.4" r="1.5" fill="#1f2a30" />
          <path
            d="M16 25c2.4 2 5.6 2 8 0"
            stroke="white"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      )}
      {!compact && (
        <span className="text-[30px] leading-none font-black tracking-tight text-leaf-500">
          {BRAND.wordmark}
        </span>
      )}
    </span>
  );
}

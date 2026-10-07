"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

import { cn } from "@/lib/cn";

import { LanguageFlag, type FlagCode } from "./LanguageFlag";

interface StripItem {
  name: string;
  /** A flag for languages, or a subject tile for the non-language courses. */
  tile: FlagCode | "chess" | "math";
  /** Only real courses link anywhere; the rest are previews. */
  available: boolean;
}

/**
 * Subjects shown along the bottom of the landing page. Spanish is the one course that exists, so
 * it is the only link (it starts the get-started flow); everything else is a disabled preview.
 */
const ITEMS: readonly StripItem[] = [
  { name: "English", tile: "us", available: false },
  { name: "Chess", tile: "chess", available: false },
  { name: "Math", tile: "math", available: false },
  { name: "Spanish", tile: "es", available: true },
  { name: "French", tile: "fr", available: false },
  { name: "German", tile: "de", available: false },
  { name: "Italian", tile: "it", available: false },
  { name: "Portuguese", tile: "br", available: false },
  { name: "Dutch", tile: "nl", available: false },
  { name: "Japanese", tile: "jp", available: false },
];

/** Strip tiles are larger than the picker's and have soft corners with no outline. */
const TILE = "h-[26px] w-[34px] rounded-[7px]";

// `relative` keeps each item's visually hidden label inside the scrolling strip.
const ITEM =
  "relative flex h-11 shrink-0 items-center gap-2.5 rounded-tile px-3 text-[13px] font-extrabold uppercase tracking-wide";
const ARROW = "focus-ring hidden shrink-0 rounded-tile p-2 text-muted hover:bg-mist sm:block";
const SCROLL_STEP = 240;

export function LanguageStrip() {
  const list = useRef<HTMLUListElement>(null);
  const scroll = (direction: 1 | -1) => list.current?.scrollBy({ left: direction * SCROLL_STEP, behavior: "smooth" });

  return (
    <nav aria-label="Courses" className="w-full min-w-0 shrink-0 border-t-2 border-line">
      <div className="mx-auto flex h-[72px] w-full max-w-[1000px] items-center gap-1 px-3">
        <button type="button" aria-label="Scroll courses left" onClick={() => scroll(-1)} className={ARROW}>
          <ChevronLeft className="size-5" strokeWidth={2.6} aria-hidden />
        </button>
        <ul
          ref={list}
          className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] lg:justify-between"
        >
          {ITEMS.map((item) => (
            <li key={item.name}>
              {item.available ? (
                <Link href="/welcome" className={cn(ITEM, "focus-ring text-ink-soft transition-colors hover:bg-mist")}>
                  <ItemTile item={item} />
                  {item.name}
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  title={`${item.name} is coming soon`}
                  className={cn(ITEM, "cursor-not-allowed text-muted")}
                >
                  <ItemTile item={item} />
                  {item.name}
                  <span className="sr-only"> (coming soon)</span>
                </span>
              )}
            </li>
          ))}
        </ul>
        <button type="button" aria-label="Scroll courses right" onClick={() => scroll(1)} className={ARROW}>
          <ChevronRight className="size-5" strokeWidth={2.6} aria-hidden />
        </button>
      </div>
    </nav>
  );
}

function ItemTile({ item }: { item: StripItem }) {
  if (item.tile === "chess") {
    return (
      <svg viewBox="0 0 34 26" className={cn(TILE, "shrink-0")} aria-hidden>
        <rect width="34" height="26" fill="var(--color-leaf-500)" />
        {/* A rook: battlements, tower and base. */}
        <path d="M11 6h3v2h1.500V6h3v2H20V6h3v5.200l-1.600 1.300v3.500H23V20H11v-4h1.600v-3.500L11 11.200V6Z" fill="white" />
      </svg>
    );
  }
  if (item.tile === "math") {
    return (
      <svg viewBox="0 0 34 26" className={cn(TILE, "shrink-0")} aria-hidden>
        <rect width="34" height="26" fill="var(--color-sky-500)" />
        <g stroke="white" strokeWidth="2.200" strokeLinecap="round">
          {/* plus, minus */}
          <path d="M9 8.500h6M12 5.500v6M19.500 8.500h6" />
          {/* equals, times */}
          <path d="M9 16h6M9 19.500h6M20 15.200l5 5M25 15.200l-5 5" />
        </g>
      </svg>
    );
  }
  return <LanguageFlag code={item.tile} className={TILE} />;
}

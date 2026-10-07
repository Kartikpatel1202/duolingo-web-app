"use client";

import { useState } from "react";

import { Button, ResponsiveDialog } from "@/components/ui";
import { BRAND } from "@/lib/brand";

/** Sidebar promo for an upcoming course. It is a preview: the action explains that honestly. */
export function ChessPromo() {
  const [open, setOpen] = useState(false);
  return (
    <section
      aria-labelledby="chess-promo-title"
      className="mt-4 hidden flex-col items-center gap-1 rounded-card border-2 border-line px-4 py-5 text-center lg:flex"
    >
      <ChessKnight className="mb-1 size-11" />
      <h2 id="chess-promo-title" className="text-[17px] font-extrabold text-ink">
        Want to learn chess?
      </h2>
      <p className="text-sm font-semibold text-muted">{BRAND.name} makes it easy!</p>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className="focus-ring mt-2 rounded-tile px-3 py-1.5 text-label font-black uppercase tracking-wide text-sky-500 hover:bg-sky-50"
      >
        Try chess
      </button>
      <ResponsiveDialog open={open} onClose={() => setOpen(false)} labelledBy="chess-dialog-title">
        <div className="flex flex-col items-center gap-4 text-center">
          <ChessKnight className="size-20" />
          <h2 id="chess-dialog-title" className="text-title font-black text-ink">
            Chess is coming soon
          </h2>
          <p className="font-semibold text-muted">
            The board is still being set up. Keep your streak going with your language course in the meantime.
          </p>
          <Button fullWidth onClick={() => setOpen(false)}>
            Got it
          </Button>
        </div>
      </ResponsiveDialog>
    </section>
  );
}

function ChessKnight({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <circle cx="35" cy="27" r="7" fill="var(--color-sky-100)" />
      <path d="M30 40c0-4 2-6 5-6s5 2 5 6H30Z" fill="var(--color-sky-400)" />
      <path
        d="M12 39c.5-6 3.500-9.500 7-12.500-2.800.6-5 2-7 4.300l-4.200-3.300c2-4.200 4.700-7.300 8.200-9.500L15 12l5.500 2.200C27.500 14.500 32 20 32 28c0 4.300-.6 7.500-1 11H12Z"
        fill="var(--color-ink-soft)"
      />
      <circle cx="18.5" cy="19.5" r="1.5" fill="var(--color-surface)" />
      <rect x="9" y="38" width="25" height="6" rx="3" fill="var(--color-ink-soft)" />
    </svg>
  );
}

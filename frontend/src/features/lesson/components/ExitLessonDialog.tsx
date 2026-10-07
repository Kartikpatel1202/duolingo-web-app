"use client";

import Image from "next/image";
import Link from "next/link";

import { Button, ResponsiveDialog } from "@/components/ui";

const TITLE_ID = "exit-lesson-title";

interface ExitLessonDialogProps {
  open: boolean;
  onStay: () => void;
}

/**
 * Confirm leaving a lesson. Escape or the backdrop keeps the learner in the lesson (there is no
 * corner close button, as in the reference); "End session" goes back to the path.
 */
export function ExitLessonDialog({ open, onStay }: ExitLessonDialogProps) {
  return (
    <ResponsiveDialog open={open} onClose={onStay} labelledBy={TITLE_ID} hideClose>
      <div className="flex flex-col items-center gap-6 text-center">
        {/* Artwork supplied with the reference (cut from the screenshot, not redrawn). */}
        <Image src="/brand/path/duo-crying.png" alt="" aria-hidden width={96} height={99} unoptimized />
        <h2 id={TITLE_ID} className="text-title font-extrabold text-balance text-ink-soft">
          Wait, don’t go! You’ll lose your progress if you quit now
        </h2>
        <div className="flex w-full flex-col items-center gap-4">
          <Button variant="secondary" size="lg" fullWidth onClick={onStay} data-autofocus>
            Keep learning
          </Button>
          <Link
            href="/learn"
            className="focus-ring rounded-tile px-3 py-1 text-[15px] font-extrabold tracking-wide text-cherry-500 uppercase hover:opacity-80"
          >
            End session
          </Link>
        </div>
      </div>
    </ResponsiveDialog>
  );
}

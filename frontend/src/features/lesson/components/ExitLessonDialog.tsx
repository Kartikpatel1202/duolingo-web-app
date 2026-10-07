"use client";

import { DoorOpen } from "lucide-react";

import { Button, ButtonLink, ResponsiveDialog } from "@/components/ui";

const TITLE_ID = "exit-lesson-title";

interface ExitLessonDialogProps {
  open: boolean;
  onStay: () => void;
}

/** Confirm leaving. Progress is kept on the server, so the learner can resume later. */
export function ExitLessonDialog({ open, onStay }: ExitLessonDialogProps) {
  return (
    <ResponsiveDialog open={open} onClose={onStay} labelledBy={TITLE_ID}>
      <div className="flex flex-col items-center gap-5 text-center">
        <span className="flex size-20 items-center justify-center rounded-full bg-sky-100 text-sky-500" aria-hidden>
          <DoorOpen className="size-10" strokeWidth={2.4} />
        </span>
        <div className="space-y-2">
          <h2 id={TITLE_ID} className="text-title font-black text-ink">
            Leaving so soon?
          </h2>
          <p className="font-semibold text-muted">Your answers are saved — you can pick up right where you left off.</p>
        </div>
        <div className="flex w-full flex-col gap-3">
          <Button size="lg" fullWidth onClick={onStay} data-autofocus>
            Keep learning
          </Button>
          <ButtonLink href="/learn" variant="ghost" size="lg" fullWidth>
            End session
          </ButtonLink>
        </div>
      </div>
    </ResponsiveDialog>
  );
}

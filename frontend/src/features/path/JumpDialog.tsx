"use client";

import { FastForward } from "lucide-react";

import { Button, ResponsiveDialog, type Tone } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { PathUnit } from "@/types/api";

import { NODE_FILL } from "./skillPresentation";

interface JumpDialogProps {
  /** The unit whose "Jump here?" was pressed (kept while the dialog animates out). */
  unit: PathUnit | null;
  tone: Tone;
  open: boolean;
  onClose: () => void;
  /** Takes the learner to the lesson they can actually start. */
  onGoToCurrent: () => void;
}

/**
 * "Jump here?" on a unit the learner has not reached. Units unlock in order — that rule lives on
 * the server and there is no placement test in this build — so the dialog says what opens the
 * unit and offers the one jump that is always valid: back to the learner's current lesson.
 */
export function JumpDialog({ unit, tone, open, onClose, onGoToCurrent }: JumpDialogProps) {
  return (
    <ResponsiveDialog open={open} onClose={onClose} labelledBy="jump-dialog-title">
      {unit && (
        <div className="flex flex-col items-center gap-4 text-center">
          <span
            className={cn("flex size-20 items-center justify-center rounded-full text-white", NODE_FILL[tone])}
            aria-hidden
          >
            <FastForward className="size-10" fill="currentColor" strokeWidth={1.5} />
          </span>
          <div className="space-y-1">
            <p className="text-label font-black uppercase text-muted">
              Section {unit.section}, Unit {unit.position}
            </p>
            <h2 id="jump-dialog-title" className="text-title font-black text-ink">
              {unit.title}
            </h2>
          </div>
          <p className="font-semibold text-muted">
            {unit.position > 1
              ? `Finish Unit ${unit.position - 1} to open this unit. Your next lesson is waiting for you.`
              : "Start with the first lesson to open this unit."}
          </p>
          <Button
            fullWidth
            onClick={() => {
              onClose();
              onGoToCurrent();
            }}
          >
            Go to my lesson
          </Button>
          <Button fullWidth variant="ghost" onClick={onClose}>
            Not now
          </Button>
        </div>
      )}
    </ResponsiveDialog>
  );
}

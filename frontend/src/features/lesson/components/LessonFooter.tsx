"use client";

import { CircleAlert } from "lucide-react";

import { Button } from "@/components/ui";
import { friendlyError, type ApiError } from "@/lib/api/errors";

/** Copy for a check that never reached a verdict (network/server failure). */
const NOT_CHECKED = "Something went wrong. Your answer wasn't checked — try again.";

interface LessonFooterProps {
  canCheck: boolean;
  checking: boolean;
  /** Skipping is possible while another exercise is waiting (see the SKIP action in the reducer). */
  canSkip: boolean;
  submitError: ApiError | null;
  onCheck: () => void;
  onSkip: () => void;
}

/**
 * Bottom action bar while answering: SKIP on the left, CHECK on the right (grey until an answer
 * is chosen). A failed check keeps the answer and offers a retry.
 */
export function LessonFooter({ canCheck, checking, canSkip, submitError, onCheck, onSkip }: LessonFooterProps) {
  const message = submitError
    ? submitError.isRetryable
      ? NOT_CHECKED
      : friendlyError(submitError).description
    : null;
  return (
    <div className="border-t-2 border-line pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-4 pt-4 sm:px-8 sm:pt-6">
        {message && (
          <p role="alert" className="flex items-center gap-2 font-bold text-cherry-700">
            <CircleAlert className="size-5 shrink-0" aria-hidden />
            {message}
          </p>
        )}
        <div className="flex items-center justify-between gap-3">
          <Button
            size="lg"
            variant="ghost"
            onClick={onSkip}
            disabled={!canSkip || checking}
            className="flex-1 text-muted sm:w-36 sm:flex-none"
          >
            Skip
          </Button>
          <Button
            size="lg"
            onClick={onCheck}
            disabled={!canCheck && !checking}
            loading={checking}
            className="flex-1 sm:w-36 sm:flex-none"
          >
            {message ? "Try again" : "Check"}
          </Button>
        </div>
      </div>
    </div>
  );
}

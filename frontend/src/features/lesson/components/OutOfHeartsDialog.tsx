"use client";

import { HeartCrack } from "lucide-react";
import { useState } from "react";

import { Button, ButtonLink, ResponsiveDialog } from "@/components/ui";
import { GemIcon } from "@/features/stats";
import { useCurrentUser } from "@/hooks/api/useLearner";
import { friendlyError } from "@/lib/api/errors";
import { timeUntil } from "@/lib/format";
import type { Hearts } from "@/types/api";

interface OutOfHeartsDialogProps {
  open: boolean;
  hearts: Hearts | null;
  refilling: boolean;
  onRefill: () => Promise<void>;
}

const TITLE_ID = "out-of-hearts-title";

/**
 * Shown when the server says there are no usable hearts. The lesson cannot continue until hearts
 * are refilled (real POST /api/hearts/refill) or regenerate over time.
 */
export function OutOfHeartsDialog({ open, hearts, refilling, onRefill }: OutOfHeartsDialogProps) {
  const { data: user } = useCurrentUser();
  const [error, setError] = useState<string | null>(null);
  const cost = hearts?.refill_cost_gems ?? user?.hearts.refill_cost_gems ?? 0;
  const gems = user?.gems ?? null;
  const affordable = gems === null || gems >= cost;
  const nextHeartAt = hearts?.next_heart_at ?? user?.hearts.next_heart_at ?? null;

  async function refill() {
    setError(null);
    try {
      await onRefill();
    } catch (refillError) {
      setError(friendlyError(refillError).description);
    }
  }

  return (
    // Closing is only possible through an explicit choice below.
    <ResponsiveDialog open={open} onClose={() => undefined} dismissible={false} labelledBy={TITLE_ID}>
      <div className="flex flex-col items-center gap-5 text-center">
        <span className="flex size-24 items-center justify-center rounded-full bg-cherry-50 text-cherry-500" aria-hidden>
          <HeartCrack className="size-14" fill="currentColor" strokeWidth={1.5} />
        </span>
        <div className="space-y-2">
          <h2 id={TITLE_ID} className="text-title font-black text-ink">
            You ran out of hearts!
          </h2>
          <p className="font-semibold text-muted">
            Refill now to keep going
            {nextHeartAt ? `, or wait — your next heart arrives in ${timeUntil(nextHeartAt)}.` : "."}
          </p>
        </div>
        {!affordable && (
          <p role="alert" className="rounded-tile bg-sun-50 px-4 py-2 font-bold text-sun-700">
            You need {cost} gems to refill — you have {gems}.
          </p>
        )}
        {error && (
          <p role="alert" className="rounded-tile bg-cherry-50 px-4 py-2 font-bold text-cherry-700">
            {error}
          </p>
        )}
        <div className="flex w-full flex-col gap-3">
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={() => void refill()}
            loading={refilling}
            disabled={!affordable}
            icon={<GemIcon className="size-6 text-white" />}
            data-autofocus
          >
            Refill for {cost} gems
          </Button>
          <ButtonLink href="/learn" variant="ghost" size="lg" fullWidth>
            Exit lesson
          </ButtonLink>
        </div>
        {gems !== null && <p className="text-sm font-bold text-muted">You have {gems} gems</p>}
      </div>
    </ResponsiveDialog>
  );
}

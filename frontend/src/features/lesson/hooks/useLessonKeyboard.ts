"use client";

import { useEffect } from "react";

/**
 * Enter performs the lesson's primary action (Check / Continue) from anywhere on the page —
 * including the answer textarea. A focused button handles Enter natively, so it is skipped here
 * to avoid acting twice.
 */
export function useLessonKeyboard(onEnter: (() => void) | null): void {
  useEffect(() => {
    if (!onEnter) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("button, a, [role='dialog']")) return;
      event.preventDefault();
      onEnter?.();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onEnter]);
}

"use client";

import { useEffect } from "react";

const MAX_SHORTCUTS = 9;

/** Keys 1–9 pick the n-th option (desktop shortcut). Ignored while typing in a field. */
export function useNumberKeys(count: number, onPick: (index: number) => void, enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable]")) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const index = Number(event.key) - 1;
      if (Number.isInteger(index) && index >= 0 && index < Math.min(count, MAX_SHORTCUTS)) {
        event.preventDefault();
        onPick(index);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [count, onPick, enabled]);
}

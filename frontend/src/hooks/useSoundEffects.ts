"use client";

import { useSyncExternalStore } from "react";

import { setSoundEnabled, soundEnabled, subscribeToSound } from "@/lib/sfx";

/** Sound-effects preference (on by default) and a setter. */
export function useSoundEffects(): { enabled: boolean; setEnabled: (enabled: boolean) => void } {
  const enabled = useSyncExternalStore(subscribeToSound, soundEnabled, () => true);
  return { enabled, setEnabled: setSoundEnabled };
}

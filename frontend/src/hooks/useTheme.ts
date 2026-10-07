"use client";

import { useSyncExternalStore } from "react";

import { readPreference, setPreference, subscribeToTheme, type ThemePreference } from "@/lib/theme";

/** The stored theme preference and a setter. "system" during server rendering. */
export function useTheme(): { preference: ThemePreference; setTheme: (p: ThemePreference) => void } {
  const preference = useSyncExternalStore(subscribeToTheme, readPreference, () => "system" as const);
  return { preference, setTheme: setPreference };
}

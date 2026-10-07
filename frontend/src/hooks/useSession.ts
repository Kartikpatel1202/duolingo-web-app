"use client";

import { useSyncExternalStore } from "react";

import { readSession, subscribeToSession } from "@/lib/auth/session";

export type SessionState = "unknown" | "signed-in" | "signed-out";

/**
 * Whether this browser holds a session. "unknown" during server rendering and hydration, when
 * storage cannot be read yet — callers render nothing decisive until it settles.
 */
export function useSession(): SessionState {
  const token = useSyncExternalStore<string | null | undefined>(subscribeToSession, readSession, () => undefined);
  if (token === undefined) return "unknown";
  return token ? "signed-in" : "signed-out";
}

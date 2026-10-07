"use client";

import { useEffect, useState } from "react";

const TICK_MS = 250;

/**
 * Seconds left until `deadline` (an ISO instant from the server). The server is the authority on
 * whether time is up; this only drives the on-screen clock.
 */
export function useCountdown(deadline: string | null): number | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!deadline) return;
    const timer = window.setInterval(() => setNow(Date.now()), TICK_MS);
    return () => window.clearInterval(timer);
  }, [deadline]);

  if (!deadline) return null;
  return Math.max(0, Math.ceil((new Date(deadline).getTime() - now) / 1000));
}

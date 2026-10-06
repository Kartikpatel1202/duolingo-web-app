"use client";

import { useState } from "react";

export interface ValueChange {
  /** -1 decreased, 0 unchanged since mount, 1 increased (latest change). */
  direction: -1 | 0 | 1;
  /** Increments on every change — use as a React `key` to replay an animation. */
  version: number;
}

/**
 * Track how a number changed between renders, without refs or effects (React's "store
 * information from previous renders" pattern).
 */
export function useValueChange(value: number): ValueChange {
  const [state, setState] = useState({ value, direction: 0 as ValueChange["direction"], version: 0 });
  if (state.value !== value) {
    const next = { value, direction: (value > state.value ? 1 : -1) as -1 | 1, version: state.version + 1 };
    setState(next);
    return { direction: next.direction, version: next.version };
  }
  return { direction: state.direction, version: state.version };
}

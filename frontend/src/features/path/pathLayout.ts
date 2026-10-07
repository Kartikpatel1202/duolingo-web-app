/**
 * Geometry of the winding path. Pure functions — no React, no DOM measurement.
 *
 * Horizontal positions are *fractions of the track width* (0 – 1) and vertical positions are
 * pixels. Nodes are placed with `left: x%` and connectors are drawn in an SVG whose viewBox is
 * 100 units wide and stretched to the track width, so both stay aligned at every screen size
 * without measuring the DOM (and render identically on the server).
 */

export const PATH_METRICS = {
  /** Vertical distance between consecutive skill centres. */
  step: 160,
  /** Room above the first node (for the START bubble) and below the last. */
  paddingTop: 116,
  paddingBottom: 72,
  /** Maximum horizontal swing, as a fraction of the track width from its centre. */
  amplitude: 0.27,
} as const;

/** One period of the wave; indexed by the skill's position in the *whole course* so that
 * consecutive units continue the same snake instead of restarting it. */
const WAVE = [0, 0.6, 1, 0.6, 0, -0.6, -1, -0.6] as const;

export interface PathPoint {
  /** 0 – 1, fraction of the track width. */
  x: number;
  /** px from the top of the track. */
  y: number;
}

export interface PathLayout {
  points: PathPoint[];
  height: number;
}

export function layoutPath(count: number, firstGlobalIndex: number): PathLayout {
  const { step, paddingTop, paddingBottom, amplitude } = PATH_METRICS;
  const points = Array.from({ length: count }, (_, i) => ({
    x: 0.5 + (WAVE[(firstGlobalIndex + i) % WAVE.length] ?? 0) * amplitude,
    y: paddingTop + i * step,
  }));
  const height = count === 0 ? 0 : paddingTop + (count - 1) * step + paddingBottom;
  return { points, height };
}

/** Smooth S-curve between two node centres, in viewBox units (x: 0 – 100, y: px). */
export function connectorPath(from: PathPoint, to: PathPoint): string {
  const bend = (to.y - from.y) / 2;
  const x1 = from.x * 100;
  const x2 = to.x * 100;
  return `M ${x1} ${from.y} C ${x1} ${from.y + bend}, ${x2} ${to.y - bend}, ${x2} ${to.y}`;
}

/**
 * A hand-tuned track: the horizontal centre of each item and a fixed step between them. Used for
 * units that configure their own geometry (see `unitArt.ts`); the START bubble gets room above
 * the first item.
 */
export function layoutFixed(
  xs: readonly number[],
  step: number,
  paddingTop = 108,
  paddingBottom = 70,
): PathLayout {
  const points = xs.map((x, i) => ({ x, y: paddingTop + i * step }));
  const height = points.length === 0 ? 0 : paddingTop + (points.length - 1) * step + paddingBottom;
  return { points, height };
}

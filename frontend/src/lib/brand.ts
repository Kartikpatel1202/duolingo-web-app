/**
 * The single place that defines the product's brand: its name, logo files and mascot artwork.
 *
 * Every screen shows the brand through <BrandLogo> and <DuoMascot>, which read this file — no
 * other file contains a logo path or the product name.
 *
 * TO INSTALL SUPPLIED ARTWORK
 *   1. Copy the files into `frontend/public/brand/` (transparent SVG or PNG).
 *   2. Fill in the paths below, e.g.
 *        name: "Duolingo",
 *        logoSrc: "/brand/duolingo-logo.svg",   // mark + wordmark
 *        markSrc: "/brand/duo.svg",             // square mark for the narrow tablet rail
 *        mascot: { idle: "/brand/duo.svg", happy: "/brand/duo-happy.svg",
 *                  celebrating: "/brand/duo-celebrate.svg", ... }
 *   Mascot states without their own file fall back to `idle`, so one file is enough to start.
 *
 * While a path is null the built-in placeholder artwork is shown instead.
 */

export const MASCOT_STATES = [
  "idle",
  "happy",
  "celebrating",
  "lesson-success",
  "lesson-failure",
  "guidebook",
  "achievement",
  "sleeping",
  "loading",
] as const;

export type MascotState = (typeof MASCOT_STATES)[number];

export interface Brand {
  /** Product name used in page titles, labels and messages. */
  name: string;
  /** Lower-case wordmark drawn next to the placeholder mark (unused once `logoSrc` is set). */
  wordmark: string;
  /** Full logo: mark + wordmark. */
  logoSrc: string | null;
  /** Mark only, for spaces too narrow for the wordmark. */
  markSrc: string | null;
  /** Logo used on the public landing page only (falls back to `logoSrc`, then the placeholder). */
  landingLogoSrc: string | null;
  /**
   * Artwork for the characters beside the learning path, e.g. "/brand/path/chef.png". The list is
   * reused in order along the path (two characters per unit), so a file appears again wherever
   * its turn comes round. Empty: the mascot is shown instead.
   */
  pathCharacters: readonly string[];
  /** Mascot artwork per state. */
  mascot: Record<MascotState, string | null>;
}

export const BRAND: Brand = {
  name: "Duolingo",
  wordmark: "duolingo",
  logoSrc: null,
  markSrc: null,
  landingLogoSrc: "/brand/duolingo-logo-landing.png",
  pathCharacters: [],
  mascot: {
    idle: null,
    happy: null,
    celebrating: null,
    "lesson-success": null,
    "lesson-failure": null,
    // The front-facing Duo (see scripts/extract_path_art.py).
    guidebook: "/brand/path/duo-front.png",
    achievement: null,
    sleeping: null,
    // Extracted from the reference (see scripts/extract_path_art.py).
    loading: "/brand/path/duo.png",
  },
};

/** The supplied artwork for a mascot state, falling back to the idle artwork. */
export function mascotSrc(state: MascotState): string | null {
  return BRAND.mascot[state] ?? BRAND.mascot.idle;
}

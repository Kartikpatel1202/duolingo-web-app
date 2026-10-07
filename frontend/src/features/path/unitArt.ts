/**
 * Per-unit presentation of the learning path, kept as data so a unit's look is configuration and
 * not a copy of a component. A unit without an entry here uses the default path (tall round
 * nodes on a wide wave, chest then trophy at the end).
 *
 * Which skills exist, their order, and whether each is locked, active or complete always come
 * from the API; this only decides how the unit is drawn.
 */

export interface PathCharacterSpec {
  /** Extracted artwork (see `scripts/extract_path_art.py`). */
  src: string;
  width: number;
  height: number;
  /** Horizontal centre, as a fraction of the track width. */
  x: number;
  /** The character stands level with this item of the track (0-based, chest and trophy count). */
  alignedWith: number;
  /** Grey artwork shown while the unit is locked (default: `src` in grey). */
  lockedSrc?: string;
}

interface ArtSize {
  src: string;
  width: number;
  height: number;
}

export interface UnitArt {
  /** Flat "coin" nodes with a visible edge, as in the reference, instead of tall round ones. */
  coinNodes: boolean;
  /** Where the treasure chest sits: after this many skills (the trophy always comes last). */
  chestAfter: number;
  /** Horizontal centre of each item along the track (skills, chest and trophy, in order). */
  xs: readonly number[];
  /** Vertical distance between items, in px. */
  step: number;
  characters: readonly PathCharacterSpec[];
  /** Artwork used while an item is locked (extracted from the reference). */
  locked: {
    node: ArtSize;
    /** Locked artwork for nodes with their own icon (backend icon key); others use `node`. */
    nodeByIcon?: Readonly<Record<string, ArtSize>>;
    chest: ArtSize;
    trophy: ArtSize;
  };
  /** Mascot artwork for the unit's guidebook header (default: the product mascot). */
  guidebookMascot?: string;
}

const ART = "/brand/path";

/** Keyed by the unit's position in the course. Add a unit by adding an entry. */
export const UNIT_ART: Record<number, UnitArt> = {
  1: {
    coinNodes: true,
    chestAfter: 3,
    // start, star, star, chest, star, trophy — a shallow S-curve, as in the reference
    xs: [0.5, 0.415, 0.37, 0.415, 0.5, 0.5],
    // Close enough to read as a tight column, far enough apart that the START/CONTINUE bubble
    // above the current coin does not cover the finished coin before it.
    step: 116,
    characters: [{ src: `${ART}/duo-front.png`, width: 120, height: 130, x: 0.79, alignedWith: 2 }],
    locked: {
      node: { src: `${ART}/star-locked.png`, width: 78, height: 73 },
      chest: { src: `${ART}/chest-locked.png`, width: 90, height: 74 },
      trophy: { src: `${ART}/trophy-locked.png`, width: 78, height: 74 },
    },
  },
  2: {
    coinNodes: true,
    chestAfter: 2,
    // jump, star, chest, headphones, star, trophy — the S-curve leans right, away from Lily
    xs: [0.5, 0.59, 0.64, 0.59, 0.5, 0.5],
    step: 116,
    characters: [
      {
        src: `${ART}/lily.png`,
        lockedSrc: `${ART}/lily-locked.png`,
        width: 81,
        height: 125,
        x: 0.27,
        alignedWith: 2,
      },
    ],
    guidebookMascot: `${ART}/lily.png`,
    locked: {
      node: { src: `${ART}/star-locked.png`, width: 78, height: 73 },
      nodeByIcon: { headphones: { src: `${ART}/headphones-locked.png`, width: 60, height: 58 } },
      chest: { src: `${ART}/chest-locked.png`, width: 90, height: 74 },
      trophy: { src: `${ART}/trophy-locked.png`, width: 78, height: 74 },
    },
  },
  10: {
    coinNodes: true,
    chestAfter: 1,
    // jump, chest, star, headphones, dumbbell, trophy — right, then back to the left
    xs: [0.5, 0.6, 0.58, 0.47, 0.42, 0.5],
    step: 116,
    characters: [
      {
        src: `${ART}/duo-reading.png`,
        lockedSrc: `${ART}/duo-reading-locked.png`,
        width: 95,
        height: 122,
        x: 0.25,
        alignedWith: 1,
      },
      // Only the grey Duo-with-ice is available, so he stays grey; he stands level with the headphones.
      { src: `${ART}/duo-ice-locked.png`, width: 72, height: 75, x: 0.78, alignedWith: 3 },
    ],
    guidebookMascot: `${ART}/duo-reading.png`,
    locked: {
      node: { src: `${ART}/star-locked.png`, width: 78, height: 73 },
      nodeByIcon: {
        headphones: { src: `${ART}/headphones-locked.png`, width: 60, height: 58 },
        book: { src: `${ART}/book-locked.png`, width: 78, height: 74 },
        dumbbell: { src: `${ART}/dumbbell-locked.png`, width: 78, height: 72 },
      },
      chest: { src: `${ART}/chest-locked.png`, width: 90, height: 74 },
      trophy: { src: `${ART}/trophy-locked.png`, width: 78, height: 74 },
    },
  },
  9: {
    coinNodes: true,
    chestAfter: 4,
    // jump, headphones, star, dumbbell, chest, trophy — sways left, then right
    xs: [0.5, 0.42, 0.46, 0.55, 0.62, 0.5],
    step: 116,
    characters: [
      // Only grey Eddys are available, so both stay grey; the ball-spinner is level with the
      // first node below the jump node, the rope-jumper with the dumbbell.
      { src: `${ART}/eddy-ball-locked.png`, width: 108, height: 132, x: 0.74, alignedWith: 1 },
      { src: `${ART}/eddy-rope-locked.png`, width: 92, height: 147, x: 0.22, alignedWith: 3 },
    ],
    guidebookMascot: `${ART}/eddy.png`,
    locked: {
      node: { src: `${ART}/star-locked.png`, width: 78, height: 73 },
      nodeByIcon: {
        headphones: { src: `${ART}/headphones-locked.png`, width: 60, height: 58 },
        book: { src: `${ART}/book-locked.png`, width: 78, height: 74 },
        dumbbell: { src: `${ART}/dumbbell-locked.png`, width: 78, height: 72 },
      },
      chest: { src: `${ART}/chest-locked.png`, width: 90, height: 74 },
      trophy: { src: `${ART}/trophy-locked.png`, width: 78, height: 74 },
    },
  },
  8: {
    coinNodes: true,
    chestAfter: 4,
    // jump, star, headphones, dumbbell, chest, trophy — drifts right, then back to the left
    xs: [0.5, 0.6, 0.55, 0.5, 0.42, 0.5],
    step: 116,
    characters: [
      {
        src: `${ART}/lucy.png`,
        lockedSrc: `${ART}/lucy-locked.png`,
        width: 94,
        height: 144,
        x: 0.24,
        alignedWith: 1,
      },
      // Only the grey Lucy-with-cat is available, so she stays grey; she stands level with the chest.
      { src: `${ART}/lucy-cat-locked.png`, width: 77, height: 129, x: 0.78, alignedWith: 4 },
    ],
    guidebookMascot: `${ART}/lucy.png`,
    locked: {
      node: { src: `${ART}/star-locked.png`, width: 78, height: 73 },
      nodeByIcon: {
        headphones: { src: `${ART}/headphones-locked.png`, width: 60, height: 58 },
        book: { src: `${ART}/book-locked.png`, width: 78, height: 74 },
        dumbbell: { src: `${ART}/dumbbell-locked.png`, width: 78, height: 72 },
      },
      chest: { src: `${ART}/chest-locked.png`, width: 90, height: 74 },
      trophy: { src: `${ART}/trophy-locked.png`, width: 78, height: 74 },
    },
  },
  7: {
    coinNodes: true,
    chestAfter: 1,
    // jump, chest, star, headphones, dumbbell, trophy — a gentle zigzag
    xs: [0.5, 0.4, 0.43, 0.52, 0.58, 0.5],
    step: 116,
    characters: [
      // Only grey artwork is available for these two, so they stay grey.
      { src: `${ART}/owl-locked.png`, width: 61, height: 82, x: 0.76, alignedWith: 1 },
      { src: `${ART}/listener-locked.png`, width: 78, height: 97, x: 0.26, alignedWith: 3 },
    ],
    guidebookMascot: `${ART}/duo-owl.png`,
    locked: {
      node: { src: `${ART}/star-locked.png`, width: 78, height: 73 },
      nodeByIcon: {
        headphones: { src: `${ART}/headphones-locked.png`, width: 60, height: 58 },
        book: { src: `${ART}/book-locked.png`, width: 78, height: 74 },
        dumbbell: { src: `${ART}/dumbbell-locked.png`, width: 78, height: 72 },
      },
      chest: { src: `${ART}/chest-locked.png`, width: 90, height: 74 },
      trophy: { src: `${ART}/trophy-locked.png`, width: 78, height: 74 },
    },
  },
  6: {
    coinNodes: true,
    chestAfter: 4,
    // jump, headphones, star, dumbbell, chest, trophy — drifts right, then back to the left
    xs: [0.5, 0.6, 0.55, 0.45, 0.4, 0.5],
    step: 116,
    characters: [
      {
        src: `${ART}/karate.png`,
        lockedSrc: `${ART}/karate-locked.png`,
        width: 70,
        height: 144,
        x: 0.22,
        alignedWith: 1,
      },
      // Only the grey explorer is available, so he stays grey; he stands level with the chest.
      { src: `${ART}/astronaut-locked.png`, width: 89, height: 136, x: 0.78, alignedWith: 4 },
    ],
    guidebookMascot: `${ART}/karate.png`,
    locked: {
      node: { src: `${ART}/star-locked.png`, width: 78, height: 73 },
      nodeByIcon: {
        headphones: { src: `${ART}/headphones-locked.png`, width: 60, height: 58 },
        book: { src: `${ART}/book-locked.png`, width: 78, height: 74 },
        dumbbell: { src: `${ART}/dumbbell-locked.png`, width: 78, height: 72 },
      },
      chest: { src: `${ART}/chest-locked.png`, width: 90, height: 74 },
      trophy: { src: `${ART}/trophy-locked.png`, width: 78, height: 74 },
    },
  },
  5: {
    coinNodes: true,
    chestAfter: 3,
    // jump, star, dumbbell, chest, headphones, trophy — leans left, then swings right
    xs: [0.5, 0.43, 0.39, 0.45, 0.58, 0.5],
    step: 116,
    characters: [
      {
        src: `${ART}/junior.png`,
        lockedSrc: `${ART}/junior-locked.png`,
        width: 94,
        height: 97,
        x: 0.76,
        alignedWith: 1,
      },
      // Only the grey Falstaff is available, so he stays grey; he lounges level with the headphones.
      { src: `${ART}/bear-locked.png`, width: 82, height: 95, x: 0.24, alignedWith: 4 },
    ],
    guidebookMascot: `${ART}/junior.png`,
    locked: {
      node: { src: `${ART}/star-locked.png`, width: 78, height: 73 },
      nodeByIcon: {
        headphones: { src: `${ART}/headphones-locked.png`, width: 60, height: 58 },
        book: { src: `${ART}/book-locked.png`, width: 78, height: 74 },
        dumbbell: { src: `${ART}/dumbbell-locked.png`, width: 78, height: 72 },
      },
      chest: { src: `${ART}/chest-locked.png`, width: 90, height: 74 },
      trophy: { src: `${ART}/trophy-locked.png`, width: 78, height: 74 },
    },
  },
  4: {
    coinNodes: true,
    chestAfter: 2,
    // jump, star, chest, headphones, dumbbell, trophy — a lazy S, right then left
    xs: [0.5, 0.6, 0.62, 0.52, 0.42, 0.5],
    step: 116,
    characters: [
      {
        src: `${ART}/duo-globe.png`,
        lockedSrc: `${ART}/duo-globe-locked.png`,
        width: 90,
        height: 99,
        x: 0.2,
        alignedWith: 2,
      },
      // Only the grey pet is available, so it stays grey; it just stands level with the dumbbell.
      { src: `${ART}/pet-locked.png`, width: 52, height: 65, x: 0.8, alignedWith: 4 },
    ],
    guidebookMascot: `${ART}/duo-globe.png`,
    locked: {
      node: { src: `${ART}/star-locked.png`, width: 78, height: 73 },
      nodeByIcon: {
        headphones: { src: `${ART}/headphones-locked.png`, width: 60, height: 58 },
        book: { src: `${ART}/book-locked.png`, width: 78, height: 74 },
        dumbbell: { src: `${ART}/dumbbell-locked.png`, width: 78, height: 72 },
      },
      chest: { src: `${ART}/chest-locked.png`, width: 90, height: 74 },
      trophy: { src: `${ART}/trophy-locked.png`, width: 78, height: 74 },
    },
  },
  3: {
    coinNodes: true,
    chestAfter: 2,
    // jump, headphones, chest, headphones, star, trophy — a loop that swings left, then right
    xs: [0.5, 0.42, 0.4, 0.5, 0.6, 0.5],
    step: 116,
    characters: [
      {
        src: `${ART}/oscar.png`,
        lockedSrc: `${ART}/oscar-locked.png`,
        width: 112,
        height: 142,
        x: 0.78,
        alignedWith: 1,
      },
    ],
    guidebookMascot: `${ART}/oscar.png`,
    locked: {
      node: { src: `${ART}/star-locked.png`, width: 78, height: 73 },
      nodeByIcon: { headphones: { src: `${ART}/headphones-locked.png`, width: 60, height: 58 } },
      chest: { src: `${ART}/chest-locked.png`, width: 90, height: 74 },
      trophy: { src: `${ART}/trophy-locked.png`, width: 78, height: 74 },
    },
  },
};

export type TrackItem = { kind: "skill"; index: number } | { kind: "chest" } | { kind: "trophy" };

/** The order things appear down a unit's track: skills, with the chest placed per `chestAfter`. */
export function trackItems(skillCount: number, art?: UnitArt): TrackItem[] {
  const chestAt = art ? Math.min(art.chestAfter, skillCount) : skillCount;
  const skills = Array.from({ length: skillCount }, (_, index): TrackItem => ({ kind: "skill", index }));
  return [...skills.slice(0, chestAt), { kind: "chest" }, ...skills.slice(chestAt), { kind: "trophy" }];
}

/** Locked artwork for a skill node: its icon's own picture when the unit has one, else the star. */
export function lockedNodeArt(art: UnitArt, icon: string): ArtSize {
  return art.locked.nodeByIcon?.[icon] ?? art.locked.node;
}

/** Widest the lesson-intro card gets (px). */
const INTRO_CARD_MAX = 340;
/** Clear space kept between the card and the unit's character (px). */
const INTRO_CARD_GAP = 12;

/**
 * Where the lesson-intro card sits and how wide it is, given the characters it would overlap
 * vertically: it starts to the right of those on the left, ends before those on the right, and is
 * capped at its usual width. (Percentages are of the track's width, so this follows the screen.)
 */
export function introCardLayout(characters: readonly PathCharacterSpec[]): { left: string; width: string } {
  const lefts = characters.filter((c) => c.x <= 0.5).map((c) => `${c.x * 100}% + ${c.width / 2 + INTRO_CARD_GAP}px`);
  const rights = characters.filter((c) => c.x > 0.5).map((c) => `${c.x * 100}% - ${c.width / 2 + INTRO_CARD_GAP}px`);
  const left = lefts.length ? `max(0px, ${lefts.map((e) => `calc(${e})`).join(", ")})` : "0px";
  const right = rights.length ? `min(100%, ${rights.map((e) => `calc(${e})`).join(", ")})` : "100%";
  return { left, width: `min(${INTRO_CARD_MAX}px, calc(${right} - ${left}))` };
}

/** The characters of a unit that stand level with the vertical band `[top, bottom]` of its track. */
export function charactersBeside(
  art: UnitArt | undefined,
  points: readonly { y: number }[],
  top: number,
  bottom: number,
): PathCharacterSpec[] {
  return (art?.characters ?? []).filter((character) => {
    const y = points[character.alignedWith]?.y;
    return y !== undefined && y + character.height / 2 > top && y - character.height / 2 < bottom;
  });
}

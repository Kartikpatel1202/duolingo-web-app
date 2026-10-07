import type { ReactNode } from "react";

/** Flag drawings on a 26 × 20 tile. Colours are literal: flags do not follow the app theme. */
const RED = "#e5484d";
const WHITE = "#ffffff";
const BLUE = "#1c64f2";
const NAVY = "#1e3a8a";
const GREEN = "#2f9e44";
const DARK_GREEN = "#12703a";
const YELLOW = "#ffc400";
const SAFFRON = "#ff9533";
const BLACK = "#1f2a30";
const SKY = "#4fb6f2";

/** Points of a five-pointed star centred on (cx, cy) with outer radius r. */
function star(cx: number, cy: number, r: number): string {
  return Array.from({ length: 10 }, (_, i) => {
    const radius = i % 2 === 0 ? r : r * 0.4;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    return `${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`;
  }).join(" ");
}

/** Equal horizontal bands, top to bottom. */
function bands(...colors: string[]): ReactNode {
  const height = 20 / colors.length;
  return colors.map((color, i) => <rect key={i} y={i * height} width="26" height={height} fill={color} />);
}

/** Equal vertical bands, left to right. */
function pales(...colors: string[]): ReactNode {
  const width = 26 / colors.length;
  return colors.map((color, i) => <rect key={i} x={i * width} width={width} height="20" fill={color} />);
}

const INDIA: ReactNode = (
  <>
    {bands(SAFFRON, WHITE, GREEN)}
    <circle cx="13" cy="10" r="2.4" fill="none" stroke={NAVY} strokeWidth="0.9" />
    <circle cx="13" cy="10" r="0.6" fill={NAVY} />
  </>
);

export type FlagCode =
  | "sa" | "in" | "cz" | "de" | "gr" | "us" | "es" | "fr" | "hu" | "id" | "it" | "jp" | "kr" | "nl"
  | "pl" | "br" | "ro" | "ru" | "se" | "th" | "ph" | "tr" | "ua" | "pk" | "vn" | "cn";

const FLAGS: Record<FlagCode, ReactNode> = {
  // Green field with a white inscription band and sword, simplified.
  sa: (
    <>
      <rect width="26" height="20" fill={DARK_GREEN} />
      <rect x="7" y="6" width="12" height="3.2" rx="1.2" fill={WHITE} />
      <rect x="7" y="12" width="12" height="1.2" rx="0.6" fill={WHITE} />
    </>
  ),
  in: INDIA,
  cz: (
    <>
      {bands(WHITE, RED)}
      <path d="M0 0 12 10 0 20Z" fill={BLUE} />
    </>
  ),
  de: bands(BLACK, RED, YELLOW),
  gr: (
    <>
      {bands(BLUE, WHITE, BLUE, WHITE, BLUE, WHITE, BLUE, WHITE, BLUE)}
      <rect width="11.1" height="11.1" fill={BLUE} />
      <rect x="4.45" width="2.2" height="11.1" fill={WHITE} />
      <rect y="4.45" width="11.1" height="2.2" fill={WHITE} />
    </>
  ),
  us: (
    <>
      {bands(RED, WHITE, RED, WHITE, RED, WHITE, RED)}
      <rect width="12" height="11.4" fill={NAVY} />
      {[2.5, 6, 9.5].flatMap((x) => [2.6, 5.7, 8.8].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="0.8" fill={WHITE} />))}
    </>
  ),
  es: (
    <>
      <rect width="26" height="20" fill={RED} />
      <rect y="5" width="26" height="10" fill={YELLOW} />
      <rect x="6" y="7.5" width="3.4" height="5" rx="1" fill={RED} opacity="0.7" />
    </>
  ),
  fr: pales(BLUE, WHITE, RED),
  hu: bands(RED, WHITE, GREEN),
  id: bands(RED, WHITE),
  it: pales(GREEN, WHITE, RED),
  jp: (
    <>
      <rect width="26" height="20" fill={WHITE} />
      <circle cx="13" cy="10" r="5" fill={RED} />
    </>
  ),
  kr: (
    <>
      <rect width="26" height="20" fill={WHITE} />
      <path d="M8.5 10a4.5 4.5 0 0 1 9 0Z" fill={RED} />
      <path d="M17.5 10a4.5 4.5 0 0 1-9 0Z" fill={BLUE} />
      <circle cx="10.75" cy="10" r="2.25" fill={RED} />
      <circle cx="15.25" cy="10" r="2.25" fill={BLUE} />
      <g stroke={BLACK} strokeWidth="0.9">
        <path d="M3.2 5.4 6 2.6M4.4 6.6 7.2 3.800" />
        <path d="M20 2.600 22.800 5.400M18.800 3.800 21.600 6.600" />
        <path d="M3.200 14.600 6 17.400M4.400 13.400 7.200 16.200" />
        <path d="M20 17.400 22.800 14.600M18.800 16.200 21.600 13.400" />
      </g>
    </>
  ),
  nl: bands(RED, WHITE, BLUE),
  pl: bands(WHITE, RED),
  br: (
    <>
      <rect width="26" height="20" fill={GREEN} />
      <path d="M13 2.500 23.500 10 13 17.500 2.500 10Z" fill={YELLOW} />
      <circle cx="13" cy="10" r="4.200" fill={NAVY} />
      <path d="M9 9.200c2.800-.8 5.600-.2 8 1.600" stroke={WHITE} strokeWidth="0.9" fill="none" />
    </>
  ),
  ro: pales(BLUE, YELLOW, RED),
  ru: bands(WHITE, BLUE, RED),
  se: (
    <>
      <rect width="26" height="20" fill={BLUE} />
      <rect x="7.500" width="3.600" height="20" fill={YELLOW} />
      <rect y="8.200" width="26" height="3.600" fill={YELLOW} />
    </>
  ),
  th: (
    <>
      <rect width="26" height="20" fill={RED} />
      <rect y="3.300" width="26" height="13.400" fill={WHITE} />
      <rect y="6.600" width="26" height="6.800" fill={NAVY} />
    </>
  ),
  ph: (
    <>
      {bands(BLUE, RED)}
      <path d="M0 0 11.500 10 0 20Z" fill={WHITE} />
      <circle cx="4.200" cy="10" r="1.900" fill={YELLOW} />
    </>
  ),
  tr: (
    <>
      <rect width="26" height="20" fill={RED} />
      <circle cx="10.500" cy="10" r="4.600" fill={WHITE} />
      <circle cx="11.800" cy="10" r="3.700" fill={RED} />
      <polygon points={star(16.6, 10, 2.3)} fill={WHITE} transform="rotate(-18 16.6 10)" />
    </>
  ),
  ua: bands(SKY, YELLOW),
  pk: (
    <>
      <rect width="26" height="20" fill={DARK_GREEN} />
      <rect width="6.500" height="20" fill={WHITE} />
      <circle cx="16.200" cy="10" r="4.400" fill={WHITE} />
      <circle cx="17.400" cy="9" r="3.700" fill={DARK_GREEN} />
      <polygon points={star(18.6, 8, 1.9)} fill={WHITE} />
    </>
  ),
  vn: (
    <>
      <rect width="26" height="20" fill={RED} />
      <polygon points={star(13, 10.4, 5)} fill={YELLOW} />
    </>
  ),
  cn: (
    <>
      <rect width="26" height="20" fill={RED} />
      <polygon points={star(6, 6.5, 3.4)} fill={YELLOW} />
      {[
        [11.5, 2.6],
        [13.6, 5],
        [13.6, 8.2],
        [11.5, 10.6],
      ].map(([x, y]) => (
        <polygon key={`${x}-${y}`} points={star(x ?? 0, y ?? 0, 1.1)} fill={YELLOW} />
      ))}
    </>
  ),
};

/** Default: the small bordered tile used in the language picker. */
const PICKER_TILE = "h-5 w-[26px] rounded-[5px] border border-line";

/** A national flag tile (decorative: the language name is always shown beside it). */
export function LanguageFlag({ code, className }: { code: FlagCode; className?: string }) {
  return (
    <svg viewBox="0 0 26 20" className={`shrink-0 overflow-hidden ${className ?? PICKER_TILE}`} aria-hidden>
      {FLAGS[code]}
    </svg>
  );
}

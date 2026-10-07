export type MascotMood = "happy" | "sleepy" | "cheer";

interface MascotProps {
  mood?: MascotMood;
  className?: string;
}

/**
 * Placeholder mascot artwork (original, pure SVG). Screens never use it directly: they render
 * <DuoMascot>, which shows this only while no mascot files are configured in `lib/brand.ts`.
 */
export function Mascot({ mood = "happy", className }: MascotProps) {
  return (
    <svg viewBox="0 0 120 120" className={className ?? "size-28"} aria-hidden>
      {mood === "sleepy" && (
        <g fill="var(--color-sky-400)" fontFamily="inherit" fontWeight="900">
          <text x="84" y="22" fontSize="18">Z</text>
          <text x="98" y="10" fontSize="12">z</text>
        </g>
      )}
      {mood === "cheer" && (
        <g stroke="var(--color-sun-500)" strokeWidth="5" strokeLinecap="round">
          <path d="M14 30 6 22M106 30l8-8M60 6V0" />
        </g>
      )}
      <ellipse cx="60" cy="112" rx="34" ry="6" fill="black" opacity="0.12" />
      <path
        d="M60 18c25 0 45 17 45 40s-20 40-45 40c-4.3 0-8.4-.5-12.3-1.5L29 106c-2.7 1.6-5.9-.8-5.1-3.8l3.9-14.9C19.7 80.3 15 70 15 58c0-23 20-40 45-40Z"
        fill="var(--color-leaf-500)"
      />
      <path
        d="M60 18c25 0 45 17 45 40 0 4-.6 7.8-1.7 11.4C99 52 82 40 60 40S21 52 16.7 69.4A40 40 0 0 1 15 58c0-23 20-40 45-40Z"
        fill="white"
        opacity="0.15"
      />
      {mood === "sleepy" ? (
        <g stroke="#1f2a30" strokeWidth="4" strokeLinecap="round" fill="none">
          <path d="M37 56c4 4 10 4 14 0M69 56c4 4 10 4 14 0" />
          <path d="M52 74c5 2 11 2 16 0" />
        </g>
      ) : (
        <g>
          {/* The eyes blink every few seconds (see `mascot-blink` in globals.css). */}
          <g className="mascot-blink">
            <circle cx="44" cy="54" r="10" fill="white" />
            <circle cx="76" cy="54" r="10" fill="white" />
            <circle cx="46" cy="56" r="5" fill="#1f2a30" />
            <circle cx="78" cy="56" r="5" fill="#1f2a30" />
          </g>
          <path
            d={mood === "cheer" ? "M44 72c8 10 24 10 32 0Z" : "M48 74c6 5 18 5 24 0"}
            stroke="white"
            strokeWidth="5"
            strokeLinecap="round"
            fill={mood === "cheer" ? "white" : "none"}
          />
        </g>
      )}
    </svg>
  );
}

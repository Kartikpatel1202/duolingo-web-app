export type TrophyTier = "bronze" | "silver" | "gold" | "diamond";

const COLORS: Record<TrophyTier, { cup: string; shine: string }> = {
  bronze: { cup: "#d08a52", shine: "#f0b483" },
  silver: { cup: "#b9c8d2", shine: "#e6eef3" },
  gold: { cup: "var(--color-sun-500)", shine: "var(--color-sun-100)" },
  diamond: { cup: "var(--color-sky-400)", shine: "var(--color-sky-100)" },
};

/** League trophy. Locked tiers render grey with a padlock. */
export function Trophy({ tier, locked = false, className }: { tier: TrophyTier; locked?: boolean; className?: string }) {
  const { cup, shine } = locked ? { cup: "var(--color-locked)", shine: "var(--color-line)" } : COLORS[tier];
  return (
    <svg viewBox="0 0 64 72" className={className ?? "size-16"} aria-hidden>
      <path d="M14 8h36v14c0 13-8 22-18 22S14 35 14 22Z" fill={cup} />
      <path d="M14 14H6v4c0 7 5 12 11 13M50 14h8v4c0 7-5 12-11 13" stroke={cup} strokeWidth="5" fill="none" />
      <path d="M20 12h6v12c0 6 3 10 6 12-7-1-12-6-12-14Z" fill={shine} opacity="0.7" />
      <rect x="28" y="42" width="8" height="12" fill={cup} />
      <rect x="18" y="54" width="28" height="10" rx="4" fill={cup} />
      {locked && (
        <g>
          <rect x="24" y="22" width="16" height="13" rx="3" fill="var(--color-muted)" />
          <path d="M27 22v-4a5 5 0 0 1 10 0v4" stroke="var(--color-muted)" strokeWidth="3" fill="none" />
        </g>
      )}
    </svg>
  );
}

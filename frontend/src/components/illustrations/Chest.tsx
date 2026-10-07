export type ChestState = "locked" | "available" | "claimed";

const PALETTE: Record<ChestState, { body: string; trim: string; lid: string }> = {
  locked: { body: "var(--color-locked)", trim: "var(--color-locked-edge)", lid: "var(--color-line-strong)" },
  available: { body: "#c9822f", trim: "var(--color-sun-500)", lid: "#e09a45" },
  claimed: { body: "#c9822f", trim: "var(--color-sun-500)", lid: "#e09a45" },
};

/** Original treasure chest: closed (locked/available) or open with sparkles (claimed). */
export function Chest({ state, className }: { state: ChestState; className?: string }) {
  const colors = PALETTE[state];
  const open = state === "claimed";
  return (
    <svg viewBox="0 0 80 72" className={className ?? "size-20"} aria-hidden>
      <ellipse cx="40" cy="68" rx="28" ry="4" fill="black" opacity="0.12" />
      <rect x="10" y="32" width="60" height="32" rx="6" fill={colors.body} />
      <rect x="10" y="32" width="60" height="7" fill={colors.trim} />
      <rect x="35" y="32" width="10" height="32" fill={colors.trim} />
      {open ? (
        <g>
          <path d="M12 30 18 8h44l6 22Z" fill={colors.lid} opacity="0.9" />
          <path d="M40 28V12M28 22l-6-8M52 22l6-8" stroke="var(--color-sun-400)" strokeWidth="4" strokeLinecap="round" />
        </g>
      ) : (
        <g>
          <path d="M10 32c0-12 9-20 18-20h24c9 0 18 8 18 20Z" fill={colors.lid} />
          <rect x="35" y="14" width="10" height="18" fill={colors.trim} />
          <rect x="34" y="34" width="12" height="12" rx="3" fill={state === "locked" ? "var(--color-muted)" : "#7a4a14"} />
        </g>
      )}
    </svg>
  );
}

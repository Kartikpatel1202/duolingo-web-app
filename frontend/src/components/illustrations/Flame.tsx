/** Large streak flame: lit (practised today) or unlit grey. */
export function Flame({ lit, className }: { lit: boolean; className?: string }) {
  const outer = lit ? "var(--color-ember-500)" : "var(--color-line-strong)";
  const inner = lit ? "var(--color-sun-400)" : "var(--color-line)";
  return (
    <svg viewBox="0 0 80 100" className={className ?? "h-28 w-24"} aria-hidden>
      <path
        d="M40 4c6 16 30 30 30 58 0 19-14 34-30 34S10 81 10 62c0-14 7-22 13-30 1 9 5 14 10 16C31 30 35 16 40 4Z"
        fill={outer}
      />
      <path d="M40 46c4 10 16 16 16 30 0 10-7 17-16 17s-16-7-16-17c0-8 5-13 9-17 0 5 3 8 6 9-1-9 0-15 1-22Z" fill={inner} />
    </svg>
  );
}

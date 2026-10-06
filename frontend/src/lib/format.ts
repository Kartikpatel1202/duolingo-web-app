const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

/** 950 → "950", 12_400 → "12.4K" — keeps stat pills from growing. */
export function formatCount(value: number): string {
  return value < 10_000 ? String(value) : compact.format(value);
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** "3 days", "5 hours" until a future instant (used for the league reset). */
export function timeUntil(isoDate: string, now: Date = new Date()): string {
  const ms = Math.max(0, new Date(isoDate).getTime() - now.getTime());
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 24) return pluralize(Math.floor(hours / 24), "day");
  if (hours >= 1) return pluralize(hours, "hour");
  return pluralize(Math.max(1, Math.ceil(ms / 60_000)), "minute");
}

export function formatMonthYear(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en", { month: "long", year: "numeric" });
}

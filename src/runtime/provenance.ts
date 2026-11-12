/** Provenance logic shared by views and markdown fallbacks. No React, no zod. */

export interface SourceLike {
  name: string;
  url?: string;
  retrievedAt?: string;
}
export interface Sourced {
  source?: SourceLike | string;
  sourceInfo?: SourceLike;
  unverified?: string[];
}

export const DAY = 86_400_000;

const sourceOf = (i: Sourced | undefined) => (i?.sourceInfo ?? (typeof i?.source === "object" ? i.source : undefined)) as SourceLike | undefined;

/** Every distinct source of a component and its items, in first-seen order. */
export function collectSources(top: SourceLike | undefined, items: Sourced[] = []): SourceLike[] {
  const seen = new Map<string, SourceLike>();
  for (const s of [top, ...items.map(sourceOf)]) if (s?.name && !seen.has(`${s.name}|${s.url ?? ""}`)) seen.set(`${s.name}|${s.url ?? ""}`, s);
  return [...seen.values()];
}

/** The most recent check time among the sources and an optional `asOf`, in ms. */
export function latestCheck(sources: SourceLike[], asOf?: string): number | undefined {
  const times = [...sources.map((s) => s.retrievedAt), asOf].map((t) => (t ? Date.parse(t) : NaN)).filter((t) => !Number.isNaN(t));
  return times.length ? Math.max(...times) : undefined;
}

/** Prices and availability older than a day may have changed. */
export const isStale = (checked: number | undefined, now = Date.now()) => checked !== undefined && now - checked > DAY;

export const isUnverified = (item: Sourced | undefined, field: string) => !!item?.unverified?.includes(field);
export const anyUnverified = (items: Array<Sourced | undefined>) => items.some((i) => !!i?.unverified?.length);

/** "2 hours ago", "1 day ago". */
export function ago(checked: number, locale: string, now = Date.now()): string {
  const minutes = Math.max(0, Math.round((now - checked) / 60_000));
  const [value, unit] = minutes < 60 ? [minutes, "minute"] : minutes < 1440 ? [Math.floor(minutes / 60), "hour"] : [Math.floor(minutes / 1440), "day"];
  try {
    return new Intl.RelativeTimeFormat(locale, { numeric: "always" }).format(-value, unit as Intl.RelativeTimeFormatUnit);
  } catch {
    return `${value} ${unit}${value === 1 ? "" : "s"} ago`;
  }
}

export interface ProvenanceInput {
  source?: SourceLike;
  items?: Sourced[];
  asOf?: string;
  /** Shows prices, ratings, phone numbers or availability: a missing source is stated, and old data is flagged. */
  sensitive?: boolean;
}

/** Provenance for the markdown fallback: one italic line, or nothing. */
export function mdProvenance(p: ProvenanceInput, now = Date.now()): string {
  const sources = collectSources(p.source, p.items);
  const checked = latestCheck(sources, p.asOf);
  if (!sources.length && !p.sensitive) return "";
  const parts = [sources.length ? `Source: ${sources.map((s) => (s.url ? `[${s.name}](${s.url})` : s.name)).join(", ")}` : "No source given"];
  if (checked !== undefined) parts.push(`checked ${new Date(checked).toISOString().slice(0, 16).replace("T", " ")} UTC`);
  if (p.sensitive && isStale(checked, now)) parts.push("may have changed");
  return `_${parts.join(" · ")}_`;
}

/** Marks a value in the markdown fallback when the agent did not fetch it. */
export const mdChecked = (item: Sourced | undefined, field: string, text: string) => (text && isUnverified(item, field) ? `${text} (not checked)` : text);

export interface ParsedTimelineDate {
  year: number;
  month: number;
  day: number;
  precision: "year" | "month" | "day";
}

export function parseTimelineDate(value: string): ParsedTimelineDate | null {
  const match = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = match[2] ? Number(match[2]) : 0;
  const day = match[3] ? Number(match[3]) : 0;
  if (month < 0 || month > 12 || (match[2] && month === 0)) return null;
  if (match[3]) {
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const days = month === 2 ? (leap ? 29 : 28) : [4, 6, 9, 11].includes(month) ? 30 : 31;
    if (day < 1 || day > days) return null;
  }
  return { year, month, day, precision: match[3] ? "day" : match[2] ? "month" : "year" };
}

export function compareTimelineDates(a: string, b: string): number {
  const left = parseTimelineDate(a)!;
  const right = parseTimelineDate(b)!;
  return left.year - right.year || left.month - right.month || left.day - right.day;
}

export function sortByDate<T extends { date: string }>(events: readonly T[]): T[] {
  return events
    .map((event, index) => ({ event, index }))
    .sort((a, b) => compareTimelineDates(a.event.date, b.event.date) || a.index - b.index)
    .map(({ event }) => event);
}

export function formatTimelineDate(value: string, locale: string): string {
  const parsed = parseTimelineDate(value);
  if (!parsed || parsed.precision === "year") return value;
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(parsed.year, (parsed.month || 1) - 1, parsed.day || 1);
  const options: Intl.DateTimeFormatOptions =
    parsed.precision === "month" ? { month: "long", year: "numeric" } : { day: "numeric", month: "short", year: "numeric" };
  try {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(date);
  } catch {
    return value;
  }
}

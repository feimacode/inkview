/** Text shared by the itinerary view, its markdown fallback and the calendar export. No zod here. */
import type { Day, Stop } from "./schema.js";

export const dayName = (day: Day, index: number) => `Day ${index + 1}${day.label ? `: ${day.label}` : ""}`;
export const timeText = (s: Stop) => (s.time ? `${s.time}${s.endTime ? `–${s.endTime}` : ""}` : "");

export function money(amount: number, currency: string, locale: string): string {
  try {
    const digits = Number.isInteger(amount) ? 0 : 2;
    return new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

/** Sum of stop costs, one total per currency, never converted. */
export function totals(stops: Stop[], locale: string): string {
  const sums = new Map<string, number>();
  for (const s of stops) if (s.cost) sums.set(s.cost.currency.toUpperCase(), (sums.get(s.cost.currency.toUpperCase()) ?? 0) + s.cost.amount);
  return [...sums].map(([currency, amount]) => money(amount, currency, locale)).join(" + ");
}

/** The plan in its current order, compact, for the model. */
export const planText = (days: Day[]) =>
  days.map((d, i) => `${dayName(d, i)}${d.date ? ` (${d.date})` : ""}: ${d.stops.map((s, n) => `${n + 1}. ${timeText(s) ? `${timeText(s)} ` : ""}${s.title}`).join("; ") || "no stops"}`).join("\n");

const pad = (n: number) => String(n).padStart(2, "0");
const escape = (text: string) => text.replace(/\\/g, "\\\\").replace(/([;,])/g, "\\$1").replace(/\r?\n/g, "\\n");

/** Folds a content line at 75 octets (RFC 5545 3.1), never inside a character. */
function fold(line: string): string {
  const out: string[] = [];
  let current = "";
  let size = 0;
  for (const ch of line) {
    const bytes = new TextEncoder().encode(ch).length;
    if (size + bytes > (out.length ? 74 : 75)) {
      out.push(current);
      current = "";
      size = 0;
    }
    current += ch;
    size += bytes;
  }
  out.push(current);
  return out.join("\r\n ");
}

/** Stops that can go in a calendar: timed, on a dated day. */
export const timedStops = (days: Day[]) => days.flatMap((d) => (d.date ? d.stops.filter((s) => s.time).map((s) => ({ date: d.date!, stop: s })) : []));

/**
 * An .ics file with one event per timed stop. Times are floating (no TZID, no
 * Z): calendars show them at the same wall-clock time wherever the user is.
 */
export function toIcs(days: Day[], now = new Date()): string {
  const stamp = now.toISOString().replace(/[-:]|\.\d+/g, "");
  const at = (date: string, time: string, plusMinutes = 0) => {
    const [y, m, d] = date.split("-").map(Number);
    const [h, min] = time.split(":").map(Number);
    const t = new Date(Date.UTC(y, m - 1, d, h, min + plusMinutes));
    return `${t.getUTCFullYear()}${pad(t.getUTCMonth() + 1)}${pad(t.getUTCDate())}T${pad(t.getUTCHours())}${pad(t.getUTCMinutes())}00`;
  };
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Inkview//Itinerary//EN"];
  timedStops(days).forEach(({ date, stop: s }, i) => {
    const end = s.endTime && s.endTime > s.time! ? at(date, s.endTime) : at(date, s.time!, 60);
    const where = s.address ?? (s.lat !== undefined ? `${s.lat},${s.lng}` : "");
    const about = [s.note, s.url].filter(Boolean).join("\n");
    lines.push("BEGIN:VEVENT", `UID:${stamp}-${i}@inkview`, `DTSTAMP:${stamp}`, `DTSTART:${at(date, s.time!)}`, `DTEND:${end}`, `SUMMARY:${escape(s.title)}`);
    if (where) lines.push(`LOCATION:${escape(where)}`);
    if (about) lines.push(`DESCRIPTION:${escape(about)}`);
    lines.push("END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}

/** Text shared by the itinerary view, its markdown fallback and the calendar export. No zod here. */
import { icsFile } from "../../runtime/ics.js";
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

/** Stops that can go in a calendar: timed, on a dated day. */
export const timedStops = (days: Day[]) => days.flatMap((d) => (d.date ? d.stops.filter((s) => s.time).map((s) => ({ date: d.date!, stop: s })) : []));

/**
 * An .ics file with one event per timed stop. Times are floating (no TZID, no
 * Z): calendars show them at the same wall-clock time wherever the user is.
 */
export function toIcs(days: Day[], now = new Date()): string {
  return icsFile(
    timedStops(days).map(({ date, stop: s }) => ({
      date,
      time: s.time!,
      endTime: s.endTime,
      title: s.title,
      location: s.address ?? (s.lat !== undefined ? `${s.lat},${s.lng}` : undefined),
      description: [s.note, s.url].filter(Boolean).join("\n") || undefined,
    })),
    "Itinerary",
    now,
  );
}

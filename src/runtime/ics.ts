/** Calendar (.ics) files for itinerary stops and event listings. No React, no zod. */

export interface IcsEvent {
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM, local to the place. Without it the event lasts the whole day. */
  time?: string;
  /** HH:MM. Without it (or when not after `time`) a timed event lasts one hour. */
  endTime?: string;
  title: string;
  location?: string;
  description?: string;
}

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

/**
 * An .ics file. Times are floating (no TZID, no Z): calendars show them at
 * the same wall-clock time wherever the user is.
 */
export function icsFile(events: IcsEvent[], product: string, now = new Date()): string {
  const stamp = now.toISOString().replace(/[-:]|\.\d+/g, "");
  const at = (date: string, time: string, plusMinutes = 0) => {
    const [y, m, d] = date.split("-").map(Number);
    const [h, min] = time.split(":").map(Number);
    const t = new Date(Date.UTC(y, m - 1, d, h, min + plusMinutes));
    return `${t.getUTCFullYear()}${pad(t.getUTCMonth() + 1)}${pad(t.getUTCDate())}T${pad(t.getUTCHours())}${pad(t.getUTCMinutes())}00`;
  };
  const day = (date: string, plusDays = 0) => {
    const [y, m, d] = date.split("-").map(Number);
    const t = new Date(Date.UTC(y, m - 1, d + plusDays));
    return `${t.getUTCFullYear()}${pad(t.getUTCMonth() + 1)}${pad(t.getUTCDate())}`;
  };
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//Inkview//${product}//EN`];
  events.forEach((e, i) => {
    lines.push("BEGIN:VEVENT", `UID:${stamp}-${i}@inkview`, `DTSTAMP:${stamp}`);
    if (e.time) {
      const end = e.endTime && e.endTime > e.time ? at(e.date, e.endTime) : at(e.date, e.time, 60);
      lines.push(`DTSTART:${at(e.date, e.time)}`, `DTEND:${end}`);
    } else {
      lines.push(`DTSTART;VALUE=DATE:${day(e.date)}`, `DTEND;VALUE=DATE:${day(e.date, 1)}`);
    }
    lines.push(`SUMMARY:${escape(e.title)}`);
    if (e.location) lines.push(`LOCATION:${escape(e.location)}`);
    if (e.description) lines.push(`DESCRIPTION:${escape(e.description)}`);
    lines.push("END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}

/** Splits an ISO 8601 date or date-time into the local date and time it states. */
export function startParts(start: string | undefined): { date: string; time?: string } | null {
  const m = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}))?/.exec(start ?? "");
  return m && !Number.isNaN(Date.parse(m[1])) ? { date: m[1], time: m[2] } : null;
}

export const fileSlug = (title: string, fallback: string) => title.replace(/[^\w-]+/g, "-").replace(/^-|-$/g, "") || fallback;

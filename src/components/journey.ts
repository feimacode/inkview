/**
 * A journey is one trip made of 1 to 6 segments (flight, train, bus or ferry
 * legs). Shared by the table's `journey` column and the comparison's journey
 * values: one shape, one text form. No zod here, so the view can import it.
 */
export interface Segment {
  from: string;
  to: string;
  /** ISO 8601 local date-time, with a UTC offset when known. */
  depart: string;
  arrive: string;
  carrier?: string;
  number?: string;
  mode?: string;
}
export interface Journey {
  segments: Segment[];
  durationMinutes?: number;
}

export const MAX_SEGMENTS = 6;
const DATE_TIME = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)(?::\d\d(?:\.\d+)?)?(Z|[+-]\d\d:?\d\d)?$/;

export const isJourney = (v: unknown): v is Journey =>
  !!v && typeof v === "object" && Array.isArray((v as Journey).segments) && (v as Journey).segments.length > 0;

/** Wall-clock time as if it were UTC, and the real instant when an offset was given. */
function parse(text: string): { local: number; at: number | null; clock: string } | null {
  const m = DATE_TIME.exec(text);
  if (!m) return null;
  const local = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  const zone = m[6];
  const offset = !zone ? null : zone === "Z" ? 0 : (zone[0] === "-" ? -1 : 1) * (+zone.slice(1, 3) * 60 + +zone.slice(-2));
  return { local, at: offset === null ? null : local - offset * 60000, clock: `${m[4]}:${m[5]}` };
}

const span = (minutes: number) => `${minutes >= 60 ? `${Math.floor(minutes / 60)}h` : ""}${minutes % 60 || minutes < 60 ? `${minutes >= 60 ? " " : ""}${minutes % 60}m` : ""}`;
const between = (a: number | null | undefined, b: number | null | undefined) => (a != null && b != null && b >= a ? Math.round((b - a) / 60000) : null);

export interface JourneyFacts {
  from: string;
  to: string;
  depart: string;
  arrive: string;
  /** Arrival's local calendar date minus departure's, in days. */
  dayOffset: number;
  /** "Direct", or "1 stop SIN 2h 10m". */
  stops: string;
  /** Total minutes, or null when it is not known. Never guessed across time zones. */
  minutes: number | null;
  duration: string;
  carriers: string;
}

export function journeyFacts(j: Journey): JourneyFacts {
  const legs = j.segments;
  const times = legs.map((s) => ({ d: parse(s.depart), a: parse(s.arrive) }));
  const first = times[0].d;
  const last = times[legs.length - 1].a;
  const minutes = typeof j.durationMinutes === "number" ? j.durationMinutes : between(first?.at, last?.at);
  const stops = legs.slice(1).map((leg, i) => {
    const prev = legs[i];
    const same = prev.to === leg.from;
    // Without offsets a layover is only known when both times are at the same place.
    const wait = between(times[i].a?.at, times[i + 1].d?.at) ?? (same ? between(times[i].a?.local, times[i + 1].d?.local) : null);
    return `${same ? leg.from : `${prev.to} to ${leg.from}`}${wait === null ? "" : ` ${span(wait)}`}`;
  });
  return {
    from: legs[0].from,
    to: legs[legs.length - 1].to,
    depart: first?.clock ?? legs[0].depart,
    arrive: last?.clock ?? legs[legs.length - 1].arrive,
    dayOffset: first && last ? Math.floor(last.local / 864e5) - Math.floor(first.local / 864e5) : 0,
    stops: stops.length ? `${stops.length} stop${stops.length > 1 ? "s" : ""} ${stops.join(", ")}` : "Direct",
    minutes,
    duration: minutes === null ? "" : span(minutes),
    carriers: [...new Set(legs.map((s) => s.carrier).filter(Boolean))].join(", "),
  };
}

export const dayMark = (f: JourneyFacts) => (f.dayOffset ? `${f.dayOffset > 0 ? "+" : ""}${f.dayOffset}` : "");

/** One readable line: `SYD 09:15 → NRT 19:40 (+1) · 1 stop SIN 2h 10m · 14h 25m · Singapore Airlines`. */
export function journeyText(j: Journey): string {
  const f = journeyFacts(j);
  return [`${f.from} ${f.depart} → ${f.to} ${f.arrive}${f.dayOffset ? ` (${dayMark(f)})` : ""}`, f.stops, f.duration, f.carriers].filter(Boolean).join(" · ");
}

/** First problem with a journey value, or null when it is valid. Server-side validation. */
export function journeyProblem(v: unknown): string | null {
  const j = v as Journey;
  if (!v || typeof v !== "object" || !Array.isArray(j.segments) || j.segments.length < 1) return "a journey needs segments (1 to 6)";
  if (j.segments.length > MAX_SEGMENTS) return `a journey has at most ${MAX_SEGMENTS} segments (got ${j.segments.length})`;
  if (j.durationMinutes !== undefined && !(typeof j.durationMinutes === "number" && j.durationMinutes >= 0)) return "durationMinutes must be a number of minutes";
  for (const [i, s] of j.segments.entries()) {
    for (const field of ["from", "to", "depart", "arrive"] as const) {
      const value = (s as Partial<Segment> | null)?.[field];
      if (typeof value !== "string" || !value.trim()) return `segment ${i + 1}: ${field} is missing`;
      if ((field === "from" || field === "to") && value.length > 40) return `segment ${i + 1}: ${field} must be at most 40 characters`;
      if ((field === "depart" || field === "arrive") && !parse(value))
        return `segment ${i + 1}: ${field} must be an ISO 8601 date-time such as 2026-03-12T09:15 or 2026-03-12T09:15+11:00`;
    }
  }
  return null;
}

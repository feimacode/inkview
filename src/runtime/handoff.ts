/**
 * Hand-off actions: the steps that take the user from a card to the business
 * itself. Every action comes from a field the agent passed; nothing here
 * books, pays or fetches. No React, no zod.
 */
import { fileSlug, icsFile, startParts } from "./ics.js";
import { mapsUrl, telUrl } from "./links.js";

export interface HandoffItem {
  title: string;
  url?: string;
  phone?: string;
  address?: string;
  lat?: number;
  lng?: number;
  /** ISO 8601 date or date-time an event starts. */
  start?: string;
  note?: string;
}

export type CopyField = "phone" | "address" | "link";

export interface HandoffOptions {
  /** Whether the host can save a file; "Add to calendar" needs it. */
  canDownload: boolean;
  /** Text of the open action, e.g. "View at store". Defaults to "Open at site". */
  openLabel?: string;
  /** Which values get a Copy action. Defaults to none. */
  copy?: CopyField[];
  /** Leave out actions the view already draws itself. */
  skip?: Array<Handoff["kind"]>;
}

export type Handoff =
  | { kind: "open"; label: string; url: string }
  | { kind: "call"; label: string; url: string }
  | { kind: "directions"; label: string; url: string }
  | { kind: "calendar"; label: string; filename: string; ics: () => string }
  | { kind: "copy"; label: string; field: CopyField; value: string };

/** How many actions show as buttons before the rest move under "More". */
export const MAX_VISIBLE = 3;

const hasPin = (i: HandoffItem) => typeof i.lat === "number" && typeof i.lng === "number";

/** The actions an item supports, primary first: open, call, directions, calendar, then copies. */
export function deriveActions(item: HandoffItem, opts: HandoffOptions): Handoff[] {
  const out: Handoff[] = [];
  if (item.url) out.push({ kind: "open", label: opts.openLabel ?? "Open at site", url: item.url });
  if (item.phone) out.push({ kind: "call", label: "Call", url: telUrl(item.phone) });
  if (hasPin(item) || item.address) {
    out.push({ kind: "directions", label: "Directions", url: mapsUrl({ label: item.title, lat: item.lat, lng: item.lng, address: item.address }) });
  }
  const start = startParts(item.start);
  if (start && opts.canDownload) {
    out.push({
      kind: "calendar",
      label: "Add to calendar",
      filename: `${fileSlug(item.title, "event")}.ics`,
      ics: () =>
        icsFile(
          [
            {
              ...start,
              title: item.title,
              location: item.address ?? (hasPin(item) ? `${item.lat},${item.lng}` : undefined),
              description: [item.note, start.time ? "End time not given; set to one hour." : "", item.url].filter(Boolean).join("\n") || undefined,
            },
          ],
          "Listing",
        ),
    });
  }
  for (const field of opts.copy ?? []) {
    const value = field === "phone" ? item.phone : field === "address" ? item.address : item.url;
    if (value) out.push({ kind: "copy", label: `Copy ${field}`, field, value });
  }
  return opts.skip ? out.filter((a) => !opts.skip!.includes(a.kind)) : out;
}

/** The same actions as markdown links, for text-only hosts. */
export function mdActions(item: HandoffItem & { unverified?: string[] }, opts: { openLabel?: string; skipOpen?: boolean } = {}): string {
  const out: string[] = [];
  if (item.url && !opts.skipOpen) out.push(`[${opts.openLabel ?? "Open at site"}](${item.url})`);
  if (item.phone) out.push(`[${item.phone}](${telUrl(item.phone)})${item.unverified?.includes("phone") ? " (not checked)" : ""}`);
  if (hasPin(item) || item.address) out.push(`[Directions](${mapsUrl({ label: item.title, lat: item.lat, lng: item.lng, address: item.address })})`);
  return out.join(" · ");
}

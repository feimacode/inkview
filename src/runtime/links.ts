/** Link helpers shared by views and markdown fallbacks. No React, no zod. */

const OPENABLE = new Set(["https:", "http:", "tel:", "mailto:"]);

/** Only web, phone and mail links are ever handed to the host or a new window. */
export function canOpen(url: string): boolean {
  try {
    return OPENABLE.has(new URL(url).protocol);
  } catch {
    return false;
  }
}

/**
 * Opens a link through the host, falling back to a new window when the host
 * refuses. Links outside the allowlist are dropped before either is tried.
 */
export function openSafely(url: string, viaHost: (url: string) => Promise<unknown>, viaWindow: (url: string) => void): void {
  if (!canOpen(url)) return;
  viaHost(url).catch(() => viaWindow(url));
}

export const telUrl = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

/** A map search for a place: coordinates when present, otherwise its address. */
export function mapsUrl(place: { label: string; lat?: number; lng?: number; address?: string }): string {
  const query = place.lat !== undefined && place.lng !== undefined ? `${place.label} ${place.lat},${place.lng}` : (place.address ?? place.label);
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(query)}`;
}

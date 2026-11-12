/** Text shared by the listings view and its markdown fallback. No zod here. */
import type { Listing, Listings } from "./schema.js";

const UNIT: Record<string, string> = { night: "per night", person: "per person", hour: "per hour", week: "per week", month: "per month", total: "total" };

export const kindOf = (l: Listing, g: Listings) => l.kind ?? g.kind;
/** A stay without a unit is priced per night. */
export const unitOf = (l: Listing, g: Listings) => l.price?.unit ?? (kindOf(l, g) === "stay" ? "night" : undefined);

function money(p: NonNullable<Listing["price"]>, locale: string, digits: number): string {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency: p.currency, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(p.amount);
  } catch {
    return `${p.amount} ${p.currency}`;
  }
}

export function priceText(l: Listing, g: Listings, locale: string): string {
  const p = l.price;
  if (!p) return "";
  const unit = unitOf(l, g);
  return `${p.from ? "from " : ""}${money(p, locale, Number.isInteger(p.amount) ? 0 : 2)}${unit ? ` ${UNIT[unit]}` : ""}`;
}

/** Rounded price for a map pin, or nothing when it would not fit. */
export function shortPrice(l: Listing, locale: string): string | undefined {
  const text = l.price ? money(l.price, locale, 0) : "";
  return text && text.length <= 8 ? text : undefined;
}

export function distanceText(l: Listing, g: Listings, locale: string): string {
  if (l.distanceKm == null) return "";
  const miles = /-(US|GB|LR|MM)\b/i.test(locale);
  const value = miles ? l.distanceKm / 1.609344 : l.distanceKm;
  return `${value < 10 ? Math.round(value * 10) / 10 : Math.round(value)} ${miles ? "mi" : "km"}${g.distanceFrom ? ` ${g.distanceFrom}` : ""}`;
}

/** Listings can be ranked by price only when every priced one shares a currency and a unit. */
export function priceSortable(g: Listings): boolean {
  const keys = new Set(g.listings.filter((l) => l.price).map((l) => `${l.price!.currency.toUpperCase()}/${unitOf(l, g) ?? ""}`));
  return keys.size === 1;
}

/** `openNow` is true only for the moment it was looked up: trust it for 3 hours. */
export function fresh(asOf: string | undefined, now = Date.now()): boolean {
  const t = asOf ? Date.parse(asOf) : NaN;
  return !Number.isNaN(t) && now - t <= 3 * 3600_000;
}

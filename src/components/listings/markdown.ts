import { mdChecked, mdProvenance } from "../../runtime/provenance.js";
import { distanceText, priceText } from "./format.js";
import { mdActions } from "../../runtime/handoff.js";
import type { Listings } from "./schema.js";

export function toMarkdown(g: Listings): string {
  const lines = g.title ? [`### ${g.title}`, ""] : [];
  g.listings.forEach((l, i) => {
    const bits = [
      mdChecked(l, "price", priceText(l, g, "en")),
      l.priceNote ?? "",
      mdChecked(l, "rating", l.rating != null ? `★ ${l.rating}${l.reviewCount != null ? ` (${l.reviewCount})` : ""}` : ""),
      distanceText(l, g, "en"),
      mdChecked(l, "start", l.start ?? ""),
      mdChecked(l, "address", l.address ?? ""),
      ...(l.badges ?? []),
      mdActions(l, { skipOpen: true }),
    ].filter(Boolean);
    lines.push(`${i + 1}. ${l.url ? `[${l.title}](${l.url})` : `**${l.title}**`}${bits.length ? ` — ${bits.join(" · ")}` : ""}`);
  });
  const tail = [g.listings.some((l) => l.price) ? "_Prices are a snapshot. Check the final price at the site._" : "", g.caption ? `_${g.caption}_` : "", mdProvenance({ source: g.source, items: g.listings, asOf: g.asOf, sensitive: true })].filter(Boolean);
  for (const t of tail) lines.push("", t);
  return lines.join("\n");
}

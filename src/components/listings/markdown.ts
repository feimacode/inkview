import { mdSource } from "../md.js";
import { distanceText, priceText } from "./format.js";
import type { Listings } from "./schema.js";

export function toMarkdown(g: Listings): string {
  const lines = g.title ? [`### ${g.title}`, ""] : [];
  g.listings.forEach((l, i) => {
    const bits = [
      priceText(l, g, "en"),
      l.priceNote ?? "",
      l.rating != null ? `★ ${l.rating}${l.reviewCount != null ? ` (${l.reviewCount})` : ""}` : "",
      distanceText(l, g, "en"),
      l.start ?? "",
      l.address ?? "",
      l.phone ?? "",
      ...(l.badges ?? []),
    ].filter(Boolean);
    lines.push(`${i + 1}. ${l.url ? `[${l.title}](${l.url})` : `**${l.title}**`}${bits.length ? ` — ${bits.join(" · ")}` : ""}`);
  });
  const tail = [g.asOf ? `_Checked ${g.asOf}. Check the final price at the site._` : "", g.caption ? `_${g.caption}_` : "", mdSource(g.source)].filter(Boolean);
  for (const t of tail) lines.push("", t);
  return lines.join("\n");
}

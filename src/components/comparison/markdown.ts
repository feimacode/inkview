import { mdTable } from "../md.js";
import { mdChecked, mdProvenance } from "../../runtime/provenance.js";
import { isJourney, journeyText } from "../journey.js";
import type { Comparison, Value } from "./schema.js";

export const valueText = (v: Value | undefined): string =>
  v == null ? "–" : typeof v === "boolean" ? (v ? "Yes" : "No") : isJourney(v) ? journeyText(v) : typeof v === "object" ? `${(v as { rating: number }).rating}/5` : String(v);

export function toMarkdown(c: Comparison): string {
  const parts: string[] = [];
  if (c.title) parts.push(`### ${c.title}`);
  parts.push(
    mdTable(
      ["", ...c.items.map((i) => (i.name === c.recommended ? `${i.name} ★` : i.name))],
      c.criteria.map((cr, j) => [cr, ...c.items.map((it, i) => mdChecked(it, cr, valueText(c.values[i]?.[j])))]),
    ),
  );
  const links = c.items.filter((i) => i.url).map((i) => `[${i.name}](${i.url})`);
  if (links.length) parts.push(`Open at site: ${links.join(" · ")}`);
  if (c.recommended) parts.push(`**Recommended: ${c.recommended}**${c.reason ? `. ${c.reason}` : ""}`);
  parts.push(mdProvenance({ source: c.source, items: c.items, sensitive: true }));
  return parts.join("\n\n");
}

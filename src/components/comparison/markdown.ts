import { mdTable } from "../md.js";
import type { Comparison, Value } from "./schema.js";

export const valueText = (v: Value | undefined): string =>
  v == null ? "–" : typeof v === "boolean" ? (v ? "Yes" : "No") : typeof v === "object" ? `${v.rating}/5` : String(v);

export function toMarkdown(c: Comparison): string {
  const parts: string[] = [];
  if (c.title) parts.push(`### ${c.title}`);
  parts.push(
    mdTable(
      ["", ...c.items.map((i) => (i.name === c.recommended ? `${i.name} ★` : i.name))],
      c.criteria.map((cr, j) => [cr, ...c.items.map((_, i) => valueText(c.values[i]?.[j]))]),
    ),
  );
  if (c.recommended) parts.push(`**Recommended: ${c.recommended}**${c.reason ? `. ${c.reason}` : ""}`);
  return parts.join("\n\n");
}

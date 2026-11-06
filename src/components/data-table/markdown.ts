import { mdSource, mdTable } from "../md.js";
import type { DataTable } from "./schema.js";

const cell = (v: unknown) =>
  v && typeof v === "object" && "url" in (v as object)
    ? `[${(v as { label?: string }).label ?? (v as { url: string }).url}](${(v as { url: string }).url})`
    : v;

export function toMarkdown(t: DataTable): string {
  const parts: string[] = [];
  if (t.title) parts.push(`### ${t.title}`);
  parts.push(mdTable(t.columns.map((c) => c.label), t.rows.map((r) => t.columns.map((c) => cell(r[c.key])))));
  if (t.caption) parts.push(`_${t.caption}_`);
  const src = mdSource(t.source);
  if (src) parts.push(src);
  return parts.join("\n\n");
}

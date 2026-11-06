import { mdSource, mdTable } from "../md.js";
import type { Chart } from "./schema.js";

export function summarize(c: Chart): string {
  const unit = c.unit ? ` ${c.unit}` : "";
  const parts = c.series.map((s) => {
    const vals = s.values.filter((v): v is number => v != null);
    if (!vals.length) return `${s.name}: no data`;
    return `${s.name} from ${Math.min(...vals)}${unit} to ${Math.max(...vals)}${unit}`;
  });
  return `${c.kind === "line" ? "Line" : "Bar"} chart${c.title ? ` of ${c.title}` : ""} over ${c.x.length} points (${c.x[0]} to ${c.x[c.x.length - 1]}): ${parts.join("; ")}.`;
}

export function toMarkdown(c: Chart): string {
  const head = c.xLabel ?? "";
  const parts = [summarize(c), mdTable([head, ...c.series.map((s) => (c.unit ? `${s.name} (${c.unit})` : s.name))], c.x.map((x, i) => [x, ...c.series.map((s) => s.values[i] ?? "")]))];
  const src = mdSource(c.source);
  if (src) parts.push(src);
  return parts.join("\n\n");
}

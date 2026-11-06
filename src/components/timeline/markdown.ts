import { mdSource } from "../md.js";
import { sortByDate } from "./date.js";
import type { Timeline } from "./schema.js";

export function toMarkdown(timeline: Timeline): string {
  const lines = timeline.title ? [`### ${timeline.title}`, ""] : [];
  for (const event of sortByDate(timeline.events)) {
    const title = event.url ? `[${event.title}](${event.url})` : event.title;
    lines.push(`- ${event.date}: ${title}${event.category ? ` · ${event.category}` : ""}`);
    if (event.detail) lines.push(`  ${event.detail}`);
  }
  if (timeline.caption) lines.push("", `_${timeline.caption}_`);
  const source = mdSource(timeline.source);
  if (source) lines.push("", source);
  return lines.join("\n");
}

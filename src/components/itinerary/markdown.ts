import { mdSource } from "../md.js";
import { dayName, money, timeText, totals } from "./format.js";
import type { Itinerary } from "./schema.js";

export function toMarkdown(plan: Itinerary): string {
  const lines = plan.title ? [`### ${plan.title}`] : [];
  plan.days.forEach((day, i) => {
    if (lines.length) lines.push("");
    lines.push(`#### ${dayName(day, i)}${day.date ? ` · ${day.date}` : ""}`, "");
    day.stops.forEach((s, n) => {
      const bits = [s.travel ?? "", s.note ?? "", s.cost ? money(s.cost.amount, s.cost.currency, "en") : ""].filter(Boolean);
      const time = timeText(s);
      lines.push(`${n + 1}. ${time ? `${time} ` : ""}${s.url ? `[${s.title}](${s.url})` : `**${s.title}**`}${bits.length ? ` — ${bits.join(" · ")}` : ""}`);
    });
    if (!day.stops.length) lines.push("_No stops yet._");
    const total = totals(day.stops, "en");
    if (total) lines.push("", `Day total: ${total}`);
  });
  if (plan.caption) lines.push("", `_${plan.caption}_`);
  const source = mdSource(plan.source);
  if (source) lines.push("", source);
  return lines.join("\n");
}

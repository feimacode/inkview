import { mdChecked, mdProvenance } from "../../runtime/provenance.js";
import { dayName, money, timeText, totals } from "./format.js";
import { mdActions } from "../../runtime/handoff.js";
import type { Itinerary } from "./schema.js";

export function toMarkdown(plan: Itinerary): string {
  const lines = plan.title ? [`### ${plan.title}`] : [];
  plan.days.forEach((day, i) => {
    if (lines.length) lines.push("");
    lines.push(`#### ${dayName(day, i)}${day.date ? ` · ${day.date}` : ""}`, "");
    day.stops.forEach((s, n) => {
      const bits = [s.travel ?? "", s.note ?? "", mdChecked(s, "cost", s.cost ? money(s.cost.amount, s.cost.currency, "en") : ""), mdActions({ title: s.title, address: s.address, lat: s.lat, lng: s.lng })].filter(Boolean);
      const time = timeText(s);
      lines.push(`${n + 1}. ${time ? `${time} ` : ""}${s.url ? `[${s.title}](${s.url})` : `**${s.title}**`}${bits.length ? ` — ${bits.join(" · ")}` : ""}`);
    });
    if (!day.stops.length) lines.push("_No stops yet._");
    const total = totals(day.stops, "en");
    if (total) lines.push("", `Day total: ${total}`);
  });
  if (plan.caption) lines.push("", `_${plan.caption}_`);
  const source = mdProvenance({ source: plan.source, items: plan.days.flatMap((d) => d.stops), sensitive: true });
  if (source) lines.push("", source);
  return lines.join("\n");
}

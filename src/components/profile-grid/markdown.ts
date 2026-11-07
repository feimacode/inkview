import { mdSource } from "../md.js";
import type { ProfileGrid } from "./schema.js";

export function toMarkdown(g: ProfileGrid): string {
  const lines = g.title ? [`### ${g.title}`, ""] : [];
  if (g.caption) lines.push(`_${g.caption}_`, "");
  g.people.forEach((p, i) => {
    const bits = [p.headline, p.profileUrl ? `[Profile](${p.profileUrl})` : ""].filter(Boolean);
    lines.push(`${i + 1}. **${p.name}**${bits.length ? ` — ${bits.join(" — ")}` : ""}`);
  });
  const src = mdSource(g.source);
  if (src) lines.push("", src);
  return lines.join("\n");
}

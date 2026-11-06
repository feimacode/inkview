import type { ProfileCard } from "./schema.js";

export function toMarkdown(p: ProfileCard): string {
  const lines: string[] = [`### ${p.name}`];
  if (p.headline) lines.push(`*${p.headline}*`);
  const meta = [p.company, p.location].filter(Boolean).join(" · ");
  if (meta) lines.push(meta);
  if (p.about) lines.push("", p.about);
  if (p.highlights?.length) lines.push("", ...p.highlights.map((h) => `- ${h}`));
  if (p.tags?.length) lines.push("", p.tags.map((t) => `\`${t}\``).join(" "));
  const links = [...(p.profileUrl ? [{ label: "Profile", url: p.profileUrl }] : []), ...(p.links ?? [])];
  if (links.length) lines.push("", links.map((l) => `[${l.label}](${l.url})`).join(" · "));
  if (p.source) lines.push("", `_Source: ${p.source.url ? `[${p.source.name}](${p.source.url})` : p.source.name}_`);
  return lines.join("\n");
}

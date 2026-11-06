import { mdSource } from "../md.js";
import type { EntityCard } from "./schema.js";

export function toMarkdown(e: EntityCard): string {
  const lines = [`### ${e.name}`];
  const sub = [e.kind && e.kind !== "other" ? e.kind[0].toUpperCase() + e.kind.slice(1) : "", e.tagline].filter(Boolean).join(" · ");
  if (sub) lines.push(`*${sub}*`);
  if (e.description) lines.push("", e.description);
  if (e.facts?.length) lines.push("", ...e.facts.map((f) => `- **${f.label}:** ${f.value}`));
  const links = [...(e.websiteUrl ? [{ label: "Website", url: e.websiteUrl }] : []), ...(e.links ?? [])];
  if (links.length) lines.push("", links.map((l) => `[${l.label}](${l.url})`).join(" · "));
  const src = mdSource(e.source);
  if (src) lines.push("", src);
  return lines.join("\n");
}

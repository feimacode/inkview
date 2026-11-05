/**
 * Profile card schema (v1): the contract the model fills when it calls
 * `show_profile_card`. Shared by the server (validation + text fallback)
 * and the UI (rendering).
 *
 * Rules every Inkview schema follows:
 *  - versioned (`PROFILE_CARD_SCHEMA_VERSION`)
 *  - unknown fields are accepted and ignored, never a validation failure
 *  - a markdown fallback is defined, for hosts that do not render MCP Apps
 */
import { z } from "zod";

export const PROFILE_CARD_SCHEMA_VERSION = "1";

const url = z.string().url();

export const ProfileLinkSchema = z.looseObject({
  label: z.string().min(1).max(60).describe('Link text, e.g. "LinkedIn", "GitHub", "Website".'),
  url: url.describe("Absolute https URL."),
});

export const ProfileCardSchema = z.looseObject({
  name: z.string().min(1).max(120).describe("Full name of the person."),
  headline: z
    .string()
    .max(200)
    .optional()
    .describe('One-line role or tagline, e.g. "Staff Rust Engineer at Ferrous Systems".'),
  avatarUrl: url
    .optional()
    .describe(
      "Photo URL. Only set it if you have a real image URL from your sources; never invent one. Initials are shown otherwise.",
    ),
  company: z.string().max(120).optional().describe("Current company or organization."),
  location: z.string().max(120).optional().describe('City and country, e.g. "Berlin, Germany".'),
  about: z.string().max(600).optional().describe("Two or three sentence summary of the person."),
  highlights: z
    .array(z.string().min(1).max(160))
    .max(6)
    .optional()
    .describe("Up to 6 short facts worth noticing: experience, notable work, awards."),
  tags: z
    .array(z.string().min(1).max(40))
    .max(10)
    .optional()
    .describe("Up to 10 skills or topics, shown as chips."),
  links: z.array(ProfileLinkSchema).max(6).optional().describe("Up to 6 links about the person."),
  profileUrl: url
    .optional()
    .describe('Primary profile page, opened by the card\'s "Open profile" button.'),
  source: z
    .looseObject({ name: z.string().max(80), url: url.optional() })
    .optional()
    .describe("Where the data came from, shown as a small attribution line."),
});

export type ProfileLink = z.infer<typeof ProfileLinkSchema>;
export type ProfileCard = z.infer<typeof ProfileCardSchema>;

/** Markdown rendering for text-only hosts (Claude Code, Codex CLI) and for the model. */
export function profileCardToMarkdown(p: ProfileCard): string {
  const lines: string[] = [`### ${p.name}`];
  if (p.headline) lines.push(`*${p.headline}*`);
  const meta = [p.company, p.location].filter(Boolean).join(" · ");
  if (meta) lines.push(meta);
  if (p.about) lines.push("", p.about);
  if (p.highlights?.length) lines.push("", ...p.highlights.map((h) => `- ${h}`));
  if (p.tags?.length) lines.push("", p.tags.map((t) => `\`${t}\``).join(" "));
  const links = [
    ...(p.profileUrl ? [{ label: "Profile", url: p.profileUrl }] : []),
    ...(p.links ?? []),
  ];
  if (links.length) lines.push("", links.map((l) => `[${l.label}](${l.url})`).join(" · "));
  if (p.source) lines.push("", `_Source: ${p.source.url ? `[${p.source.name}](${p.source.url})` : p.source.name}_`);
  return lines.join("\n");
}

/** Initials for the avatar placeholder. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

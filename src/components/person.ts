/** Person fields shared by the profile card and the profile grid. */
import { z } from "zod";

const url = z.string().url();

export const ProfileLinkSchema = z.looseObject({
  label: z.string().min(1).max(60).describe('Link text, e.g. "LinkedIn", "GitHub", "Website".'),
  url: url.describe("Absolute https URL."),
});

export const SourceSchema = z
  .looseObject({ name: z.string().max(80), url: url.optional() })
  .describe("Where the data came from, shown as a small attribution line.");

export const PersonSchema = z.looseObject({
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
  tags: z.array(z.string().min(1).max(40)).max(10).optional().describe("Up to 10 skills or topics, shown as chips."),
  links: z.array(ProfileLinkSchema).max(6).optional().describe("Up to 6 links about the person."),
  profileUrl: url.optional().describe('Primary profile page, opened by the card\'s "Open profile" button.'),
  source: SourceSchema.optional(),
});

export type Person = z.infer<typeof PersonSchema>;

import { z } from "zod";

const url = z.string().url();

export const schema = z.looseObject({
  name: z.string().min(1).max(120),
  kind: z.enum(["company", "organization", "place", "other"]).optional(),
  logoUrl: url.optional().describe("Logo or photo URL from your sources; never invent one. A monogram is shown otherwise."),
  tagline: z.string().max(160).optional().describe('One line, e.g. "Payments infrastructure for the internet".'),
  description: z.string().max(600).optional(),
  facts: z
    .array(z.looseObject({ label: z.string().min(1).max(40), value: z.string().min(1).max(120) }))
    .max(8)
    .optional()
    .describe('Up to 8 label/value pairs, e.g. {"label": "Founded", "value": "2010"}.'),
  links: z.array(z.looseObject({ label: z.string().min(1).max(60), url })).max(6).optional(),
  websiteUrl: url.optional().describe('Opened by the "Open website" button.'),
  source: z.looseObject({ name: z.string().max(80), url: url.optional() }).optional(),
});

export type EntityCard = z.infer<typeof schema>;

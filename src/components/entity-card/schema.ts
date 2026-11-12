import { z } from "zod";
import { SourceSchema, UnverifiedSchema } from "../provenance.js";
import { httpUrl, phone } from "../fields.js";

const url = httpUrl;

export const MAX_FACTS = 8;
/** Upper bound for servers that raise the fact cap through the SDK. */
export const HARD_MAX_FACTS = 50;

export function entityCardSchema(maxFacts = MAX_FACTS) {
  return z.looseObject({
    name: z.string().min(1).max(120),
    kind: z.enum(["company", "organization", "place", "other"]).optional(),
    logoUrl: url.optional().describe("Logo or photo URL from your sources; never invent one. A monogram is shown otherwise."),
    tagline: z.string().max(160).optional().describe('One line, e.g. "Payments infrastructure for the internet".'),
    description: z.string().max(600).optional(),
    facts: z
      .array(z.looseObject({ label: z.string().min(1).max(40), value: z.string().min(1).max(120) }))
      .max(maxFacts)
      .optional()
      .describe(`Up to ${maxFacts} label/value pairs, e.g. {"label": "Founded", "value": "2010"}.`),
    links: z.array(z.looseObject({ label: z.string().min(1).max(60), url })).max(6).optional(),
    websiteUrl: url.optional().describe('Opened by the "Open website" button.'),
    phone: phone.optional().describe("Phone number from your source; adds a Call action. Never guess one."),
    address: z.string().max(200).optional().describe("Street address from your source; adds a Directions action."),
    source: SourceSchema.optional(),
    unverified: UnverifiedSchema.optional().describe('Fact labels, "phone" or "address" that you did not fetch from a source.'),
  });
}

export const schema = entityCardSchema();

export type EntityCard = z.infer<typeof schema>;

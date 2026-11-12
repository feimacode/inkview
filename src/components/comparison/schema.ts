import { z } from "zod";
import { httpUrl } from "../fields.js";
import { SourceSchema, UnverifiedSchema } from "../provenance.js";
import { journeyProblem } from "../journey.js";

const url = httpUrl;

export const ValueSchema = z.union([
  z.string().max(200),
  z.number(),
  z.boolean(),
  z.looseObject({ rating: z.number().min(0).max(5) }),
  z
    .looseObject({ type: z.literal("journey"), segments: z.array(z.looseObject({})), durationMinutes: z.number().optional() })
    .describe("A flight, train or bus trip: 1 to 6 segments of {from, to, depart, arrive, carrier?, number?, mode?} with ISO 8601 local date-times."),
  z.null(),
]);

export const MAX_ITEMS = 5;
/** Upper bound for servers that raise the item cap through the SDK. */
export const HARD_MAX_ITEMS = 20;

export function comparisonSchema(maxItems = MAX_ITEMS) {
  return z.looseObject({
    title: z.string().max(120).optional(),
    items: z
      .array(z.looseObject({
          name: z.string().min(1).max(80),
          subtitle: z.string().max(120).optional(),
          imageUrl: url.optional(),
          url: url.optional().describe("The option's own page, opened by \"Open at site\"."),
          source: SourceSchema.optional().describe("Where this option's values came from."),
          unverified: UnverifiedSchema.optional().describe("Names of the criteria whose value for this option you did not fetch from a source."),
        }))
      .min(2)
      .max(maxItems)
      .describe(`2 to ${maxItems} options.`),
    criteria: z.array(z.string().min(1).max(60)).min(1).max(12).describe("1 to 12 criteria, in display order."),
    values: z
      .array(z.array(ValueSchema))
      .describe("One row per item, in the same order as items; each row has one value per criterion."),
    recommended: z.string().max(80).optional().describe("Name of the recommended item, exactly as in items."),
    reason: z.string().max(300).optional().describe("Why it is recommended, one or two sentences."),
    source: SourceSchema.optional(),
  }).superRefine((c, ctx) => {
    c.values.forEach((row, i) =>
      row.forEach((v, j) => {
        const problem = v && typeof v === "object" && "type" in v ? journeyProblem(v) : null;
        if (problem) ctx.addIssue({ code: "custom", path: ["values", i, j], message: `${c.items[i]?.name ?? `Item ${i + 1}`}, "${c.criteria[j] ?? `criterion ${j + 1}`}": ${problem}.` });
      }),
    );
  });
}

export const schema = comparisonSchema();

export type Value = z.infer<typeof ValueSchema>;
export type Comparison = z.infer<typeof schema>;

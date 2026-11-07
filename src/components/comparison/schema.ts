import { z } from "zod";

const url = z.string().url();

export const ValueSchema = z.union([
  z.string().max(200),
  z.number(),
  z.boolean(),
  z.looseObject({ rating: z.number().min(0).max(5) }),
  z.null(),
]);

export const MAX_ITEMS = 5;
/** Upper bound for servers that raise the item cap through the SDK. */
export const HARD_MAX_ITEMS = 20;

export function comparisonSchema(maxItems = MAX_ITEMS) {
  return z.looseObject({
    title: z.string().max(120).optional(),
    items: z
      .array(z.looseObject({ name: z.string().min(1).max(80), subtitle: z.string().max(120).optional(), imageUrl: url.optional(), url: url.optional() }))
      .min(2)
      .max(maxItems)
      .describe(`2 to ${maxItems} options.`),
    criteria: z.array(z.string().min(1).max(60)).min(1).max(12).describe("1 to 12 criteria, in display order."),
    values: z
      .array(z.array(ValueSchema))
      .describe("One row per item, in the same order as items; each row has one value per criterion."),
    recommended: z.string().max(80).optional().describe("Name of the recommended item, exactly as in items."),
    reason: z.string().max(300).optional().describe("Why it is recommended, one or two sentences."),
  });
}

export const schema = comparisonSchema();

export type Value = z.infer<typeof ValueSchema>;
export type Comparison = z.infer<typeof schema>;

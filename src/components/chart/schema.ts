import { z } from "zod";

export const schema = z
  .looseObject({
    kind: z.enum(["line", "bar"]).describe("line for values over time, bar for comparing categories."),
    title: z.string().max(120).optional(),
    x: z.array(z.string().max(40)).min(1).max(100).describe("X-axis labels or ISO dates, in order."),
    series: z
      .array(z.looseObject({ name: z.string().min(1).max(60), values: z.array(z.number().nullable()) }))
      .min(1)
      .max(5)
      .describe("1 to 5 series, each with one value per x (null for a gap)."),
    unit: z.string().max(20).optional().describe('Unit shown with values, e.g. "USD", "%", "ms".'),
    xLabel: z.string().max(60).optional(),
    yLabel: z.string().max(60).optional(),
    source: z.looseObject({ name: z.string().max(80), url: z.string().url().optional() }).optional(),
  })
  .superRefine((c, ctx) => {
    c.series.forEach((s, i) => {
      if (s.values.length !== c.x.length)
        ctx.addIssue({
          code: "custom",
          path: ["series", i, "values"],
          message: `Series "${s.name}" has ${s.values.length} values but x has ${c.x.length}; give one value per x (null for gaps).`,
        });
    });
  });

export type Chart = z.infer<typeof schema>;

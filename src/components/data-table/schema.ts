import { z } from "zod";
import { SourceSchema } from "../provenance.js";
import { httpUrl } from "../fields.js";
import { journeyProblem } from "../journey.js";

export const MAX_ROWS = 50;
/** Upper bound for servers that raise the row cap through the SDK. */
export const HARD_MAX_ROWS = 500;

export const ColumnSchema = z.looseObject({
  key: z.string().min(1).max(60).describe("Key of this column's value in each row."),
  label: z.string().min(1).max(60).describe("Column header shown to the user."),
  type: z
    .enum(["text", "number", "money", "date", "link", "badge", "journey"])
    .default("text")
    .describe("text | number | money | date (ISO 8601) | link (URL, or {label, url}) | badge (short status) | journey (a flight, train or bus trip: {segments: [{from, to, depart, arrive, carrier?, number?, mode?}], durationMinutes?} with 1 to 6 segments and ISO 8601 local date-times)."),
  currency: z.string().length(3).optional().describe("ISO 4217 code for money columns, e.g. USD."),
});

export function tableSchema(maxRows = MAX_ROWS) {
  return z.looseObject({
    title: z.string().max(120).optional().describe("Table title."),
    caption: z.string().max(300).optional().describe('Short note under the table, e.g. "Top 50 of 312 results".'),
    columns: z.array(ColumnSchema).min(1).max(12).describe("1 to 12 columns, in display order."),
    rows: z
      .array(z.record(z.string(), z.unknown()))
      .min(1)
      .max(maxRows, `Send at most ${maxRows} rows: pick the most relevant and state the total in caption.`)
      .describe(`1 to ${maxRows} rows, each an object keyed by column key.`),
    source: SourceSchema.optional(),
  }).superRefine((t, ctx) => {
    for (const c of t.columns) {
      if (c.type !== "journey") continue;
      t.rows.forEach((row, i) => {
        const problem = row[c.key] == null ? null : journeyProblem(row[c.key]);
        if (problem) ctx.addIssue({ code: "custom", path: ["rows", i, c.key], message: `Row ${i + 1}, column "${c.label}": ${problem}.` });
      });
    }
  });
}

export const schema = tableSchema();

export type Column = z.infer<typeof ColumnSchema>;
export type DataTable = z.infer<typeof schema>;

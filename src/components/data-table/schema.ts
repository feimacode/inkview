import { z } from "zod";

export const MAX_ROWS = 50;

export const ColumnSchema = z.looseObject({
  key: z.string().min(1).max(60).describe("Key of this column's value in each row."),
  label: z.string().min(1).max(60).describe("Column header shown to the user."),
  type: z
    .enum(["text", "number", "money", "date", "link", "badge"])
    .default("text")
    .describe("text | number | money | date (ISO 8601) | link (URL, or {label, url}) | badge (short status)."),
  currency: z.string().length(3).optional().describe("ISO 4217 code for money columns, e.g. USD."),
});

export const schema = z.looseObject({
  title: z.string().max(120).optional().describe("Table title."),
  caption: z.string().max(300).optional().describe('Short note under the table, e.g. "Top 50 of 312 results".'),
  columns: z.array(ColumnSchema).min(1).max(12).describe("1 to 12 columns, in display order."),
  rows: z
    .array(z.record(z.string(), z.unknown()))
    .min(1)
    .max(MAX_ROWS, `Send at most ${MAX_ROWS} rows: pick the most relevant and state the total in caption.`)
    .describe(`1 to ${MAX_ROWS} rows, each an object keyed by column key.`),
  source: z.looseObject({ name: z.string().max(80), url: z.string().url().optional() }).optional(),
});

export type Column = z.infer<typeof ColumnSchema>;
export type DataTable = z.infer<typeof schema>;

import { z } from "zod";
import { SourceSchema } from "../provenance.js";
import { httpUrl } from "../fields.js";
import { parseIsoDate } from "./date.js";

export const MAX_ITEMS = 50;
/** Upper bound for servers that raise the item cap through the SDK. */
export const HARD_MAX_ITEMS = 500;
export const DEFAULT_STATUSES = ["To do", "In progress", "Done"];

const due = z
  .string()
  .refine((value) => parseIsoDate(value) !== null, "Use YYYY-MM-DD.")
  .describe("Due date as YYYY-MM-DD.");

const status = z.string().min(1).max(40);

export function taskListSchema(maxItems = MAX_ITEMS) {
  return z
    .looseObject({
      title: z.string().max(120).optional(),
      statuses: z
        .array(status)
        .min(2)
        .max(6)
        .default(DEFAULT_STATUSES)
        .describe('Ordered status names, 2 to 6. Defaults to "To do", "In progress", "Done".'),
      items: z
        .array(
          z.looseObject({
            id: z.string().min(1).max(80).optional(),
            title: z.string().min(1).max(160),
            status: status.describe("One of the statuses."),
            owner: z.string().min(1).max(80).optional(),
            due: due.optional(),
            priority: z.enum(["low", "medium", "high"]).optional(),
            url: httpUrl.optional(),
            labels: z.array(z.string().min(1).max(40)).max(8).optional(),
          }),
        )
        .min(1)
        .max(maxItems, `Send the ${maxItems} most relevant items.`)
        .describe(`1 to ${maxItems} items, each with a title and a status.`),
      source: SourceSchema.optional(),
    })
    .superRefine((value, ctx) => {
      value.items.forEach((item, index) => {
        if (!value.statuses.includes(item.status)) {
          ctx.addIssue({
            code: "custom",
            path: ["items", index, "status"],
            message: `Status "${item.status}" is not one of: ${value.statuses.join(", ")}.`,
          });
        }
      });
    });
}

export const schema = taskListSchema();

export type TaskList = z.infer<typeof schema>;
export type TaskItem = TaskList["items"][number];

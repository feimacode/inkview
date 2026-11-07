import { z } from "zod";
import { parseIsoDate } from "./date.js";

export const MAX_ITEMS = 50;
export const DEFAULT_STATUSES = ["To do", "In progress", "Done"];

const due = z
  .string()
  .refine((value) => parseIsoDate(value) !== null, "Use YYYY-MM-DD.")
  .describe("Due date as YYYY-MM-DD.");

const status = z.string().min(1).max(40);

export const schema = z
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
          url: z.string().url().optional(),
          labels: z.array(z.string().min(1).max(40)).max(8).optional(),
        }),
      )
      .min(1)
      .max(MAX_ITEMS, `Send the ${MAX_ITEMS} most relevant items.`)
      .describe("1 to 50 items, each with a title and a status."),
    source: z.looseObject({ name: z.string().max(80), url: z.string().url().optional() }).optional(),
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

export type TaskList = z.infer<typeof schema>;
export type TaskItem = TaskList["items"][number];

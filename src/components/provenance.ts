/** Provenance fields shared by component schemas. Server only (uses zod). */
import { z } from "zod";
import { httpUrl } from "./fields.js";

const ISO = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;

export const SourceSchema = z
  .looseObject({
    name: z.string().max(80).describe("Site or tool the data came from."),
    url: httpUrl.optional(),
    retrievedAt: z
      .string()
      .max(40)
      .refine((v) => ISO.test(v) && !Number.isNaN(Date.parse(v)), "retrievedAt must be an ISO 8601 date-time, e.g. 2026-11-12T09:30:00+11:00.")
      .optional()
      .describe("ISO 8601 date-time when you fetched the data."),
  })
  .describe("Where the data came from and when you fetched it, shown as a small attribution line.");

/** Field names whose values the agent stated without fetching them. */
export const UnverifiedSchema = z
  .array(z.string().min(1).max(40))
  .max(20)
  .describe('Names of this item\'s fields you did not fetch from a source, e.g. ["price", "phone"]. They are shown with a "not checked" mark.');

/** Per-item provenance fields, spread into an item schema's shape. */
export const itemProvenance = {
  source: SourceSchema.optional().describe("Where this item came from, when items come from different sites."),
  unverified: UnverifiedSchema.optional(),
};

export type Source = z.infer<typeof SourceSchema>;

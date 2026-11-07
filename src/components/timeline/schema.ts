import { z } from "zod";
import { parseTimelineDate } from "./date.js";

export const MAX_EVENTS = 50;
/** Upper bound for servers that raise the event cap through the SDK. */
export const HARD_MAX_EVENTS = 500;

const date = z
  .string()
  .refine((value) => parseTimelineDate(value) !== null, "Use YYYY-MM-DD, YYYY-MM or YYYY.")
  .describe("ISO date at day, month or year precision: YYYY-MM-DD, YYYY-MM or YYYY.");

export function timelineSchema(maxEvents = MAX_EVENTS) {
  return z.looseObject({
    title: z.string().max(120).optional(),
    caption: z.string().max(300).optional().describe('Short note under the timeline, e.g. "50 of 83 events".'),
    events: z
      .array(
        z.looseObject({
          date,
          title: z.string().min(1).max(160),
          detail: z.string().max(1200).optional(),
          url: z.string().url().optional(),
          category: z.string().min(1).max(60).optional(),
        }),
      )
      .min(1)
      .max(maxEvents, `Send the ${maxEvents} most relevant events and state the total in caption.`)
      .describe(`1 to ${maxEvents} dated events, shown oldest first.`),
    source: z.looseObject({ name: z.string().max(80), url: z.string().url().optional() }).optional(),
  });
}

export const schema = timelineSchema();

export type Timeline = z.infer<typeof schema>;
export type TimelineEvent = Timeline["events"][number];

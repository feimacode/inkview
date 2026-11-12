import { z } from "zod";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Times are 24-hour HH:MM, e.g. 09:30.");

export const StopSchema = z
  .looseObject({
    id: z.string().min(1).max(60).optional(),
    title: z.string().min(1).max(160),
    time: time.optional().describe("Start, local to the place."),
    endTime: time.optional(),
    kind: z.enum(["see", "eat", "stay", "travel", "other"]).optional(),
    note: z.string().max(300).optional(),
    cost: z.looseObject({ amount: z.number().nonnegative(), currency: z.string().length(3).describe("ISO 4217, e.g. JPY.") }).optional(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
    address: z.string().max(200).optional(),
    url: z.string().url().optional(),
    travel: z.string().max(80).optional().describe('How to get here from the previous stop, e.g. "15 min walk".'),
  })
  .superRefine((s, ctx) => {
    if ((s.lat === undefined) !== (s.lng === undefined)) {
      const missing = s.lat === undefined ? "lat" : "lng";
      ctx.addIssue({ code: "custom", path: [missing], message: `${missing} is missing: pass both lat and lng, or neither.` });
    }
  });

export const MAX_DAYS = 14;
export const MAX_STOPS = 12;
/** Upper bound for servers that raise the day cap through the SDK. */
export const HARD_MAX_DAYS = 60;

export function itinerarySchema(maxDays = MAX_DAYS) {
  return z.looseObject({
    title: z.string().max(120).optional(),
    days: z
      .array(
        z.looseObject({
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Dates are YYYY-MM-DD.").optional(),
          label: z.string().max(60).optional().describe('Short name for the day, e.g. "Arashiyama".'),
          stops: z.array(StopSchema).max(MAX_STOPS, `Send at most ${MAX_STOPS} stops a day.`),
        }),
      )
      .min(1)
      .max(maxDays, `Send at most ${maxDays} days; split a longer trip into parts.`)
      .describe(`1 to ${maxDays} days in order, each with its stops in visit order.`),
    caption: z.string().max(300).optional(),
    source: z.looseObject({ name: z.string().max(80), url: z.string().url().optional() }).optional(),
  });
}

export const schema = itinerarySchema();

export type Stop = z.infer<typeof StopSchema>;
export type Itinerary = z.infer<typeof schema>;
export type Day = Itinerary["days"][number];

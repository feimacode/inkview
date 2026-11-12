import { z } from "zod";

const url = z.string().url();
export const KINDS = ["stay", "service", "place", "event", "home"] as const;
export const UNITS = ["night", "person", "hour", "week", "month", "total"] as const;
const kind = z.enum(KINDS);

export const ListingSchema = z
  .looseObject({
    id: z.string().min(1).max(60).optional(),
    title: z.string().min(1).max(160).describe("Name of the place, provider, stay, event or home."),
    kind: kind.optional().describe("Overrides the kind set for the whole call."),
    imageUrl: url.optional(),
    price: z
      .looseObject({
        amount: z.number().nonnegative(),
        currency: z.string().length(3).describe("ISO 4217, e.g. AUD."),
        unit: z.enum(UNITS).optional().describe("What the amount covers. A stay without a unit is shown per night."),
        from: z.boolean().optional().describe('True shows "from" before the price.'),
      })
      .optional(),
    priceNote: z.string().max(60).optional().describe('Short note such as "call-out fee" or "free cancellation".'),
    rating: z.number().min(0).max(5).optional(),
    reviewCount: z.number().int().nonnegative().optional(),
    badges: z
      .array(z.string().min(1).max(24))
      .max(4)
      .optional()
      .describe('Up to 4 short facts your source states, e.g. "Licensed". Never guess a badge.'),
    detail: z.string().max(300).optional(),
    address: z.string().max(200).optional(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
    distanceKm: z.number().nonnegative().optional().describe("Distance in kilometres from the place named in distanceFrom."),
    openNow: z.boolean().optional().describe("Whether it was open when you looked it up; needs asOf."),
    hours: z.string().max(80).optional().describe('Opening hours as short text, e.g. "Mon to Fri 7am to 5pm".'),
    start: z.string().max(40).optional().describe("ISO 8601 date or date-time an event starts."),
    phone: z
      .string()
      .min(3)
      .max(30)
      .regex(/^[\d\s+\-()]+$/, "phone may contain only digits, spaces, +, -, ( and ).")
      .optional(),
    url: url.optional().describe("The listing's own page: where the user books, contacts or reads more."),
  })
  .superRefine((l, ctx) => {
    if ((l.lat === undefined) !== (l.lng === undefined)) {
      const missing = l.lat === undefined ? "lat" : "lng";
      ctx.addIssue({ code: "custom", path: [missing], message: `${missing} is missing: pass both lat and lng, or neither.` });
    }
  });

export const MAX_LISTINGS = 20;
/** Upper bound for servers that raise the listing cap through the SDK. */
export const HARD_MAX_LISTINGS = 100;

export function listingsSchema(maxListings = MAX_LISTINGS) {
  return z.looseObject({
    title: z.string().max(120).optional(),
    kind: kind.optional().describe("What every listing is, unless a listing sets its own kind."),
    listings: z
      .array(ListingSchema)
      .min(1)
      .max(maxListings, `Send the ${maxListings} most relevant listings and state the total in caption.`)
      .describe(`1 to ${maxListings} listings, best match first.`),
    distanceFrom: z.string().max(80).optional().describe('Where distances are measured from, e.g. "from Parramatta station".'),
    asOf: z.string().max(40).optional().describe("ISO 8601 date-time when prices and opening state were looked up."),
    caption: z.string().max(300).optional(),
    source: z.looseObject({ name: z.string().max(80), url: url.optional() }).optional(),
  });
}

export const schema = listingsSchema();

export type Listing = z.infer<typeof ListingSchema>;
export type Listings = z.infer<typeof schema>;

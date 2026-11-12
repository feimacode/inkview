import { z } from "zod";
import { itemProvenance, SourceSchema } from "../provenance.js";
import { httpUrl } from "../fields.js";

export const MAX_PLACES = 50;
/** Upper bound for servers that raise the place cap through the SDK. */
export const HARD_MAX_PLACES = 500;
export const MAX_PIN_LABEL = 8;

const coordinate = (label: string, min: number, max: number) =>
  z
    .number({
      error: (issue) =>
        issue.input === undefined
          ? `${label} is missing.`
          : `${label} must be a number between ${min} and ${max}.`,
    })
    .min(min, `${label} must be at least ${min}.`)
    .max(max, `${label} must be at most ${max}.`);

const place = z.looseObject({
  id: z.string().min(1).max(60).optional().describe("Stable id for this place, unique within the map."),
  label: z.string().min(1).max(120).describe("Name shown on the pin and in the list."),
  lat: coordinate("Latitude", -90, 90).optional().describe("WGS84 latitude in decimal degrees. Pass it with lng whenever you have them."),
  lng: coordinate("Longitude", -180, 180).optional().describe("WGS84 longitude in decimal degrees."),
  detail: z.string().max(600).optional().describe("One or two sentences shown when the place is selected."),
  category: z.string().min(1).max(60).optional().describe("Short group such as Restaurant, Office or Venue."),
  address: z.string().max(200).optional().describe("Street address. Required when lat and lng are missing; the place is then listed without a pin."),
  pinLabel: z
    .string()
    .min(1)
    .max(MAX_PIN_LABEL, `pinLabel must be at most ${MAX_PIN_LABEL} characters.`)
    .optional()
    .describe('Short text drawn on the pin, such as a price ("$210") or a rating ("4.8").'),
  url: httpUrl.optional().describe("Page with more about this place."),
  ...itemProvenance,
}).superRefine((p, ctx) => {
  const hasLat = p.lat !== undefined;
  const hasLng = p.lng !== undefined;
  if (hasLat !== hasLng) {
    const missing = hasLat ? "lng" : "lat";
    ctx.addIssue({ code: "custom", path: [missing], message: `${missing} is missing: pass both lat and lng, or neither with an address.` });
  } else if (!hasLat && !p.address?.trim()) {
    ctx.addIssue({ code: "custom", message: "Each place needs coordinates (lat and lng) or an address. Inkview does not look up addresses." });
  }
});

export function mapSchema(maxPlaces = MAX_PLACES) {
  return z.looseObject({
    title: z.string().min(1).max(120).optional().describe("Heading above the map."),
    caption: z.string().max(300).optional().describe('Short note under the map, e.g. "12 of 40 places".'),
    places: z
      .array(place)
      .min(1)
      .max(maxPlaces, `Send the ${maxPlaces} most relevant places and state the total in caption.`)
      .describe(`1 to ${maxPlaces} places, each with a label and WGS84 coordinates, or an address when you have no coordinates.`),
    source: SourceSchema.optional(),
  });
}

export const schema = mapSchema();

export type MapData = z.infer<typeof schema>;
export type MapPlace = MapData["places"][number];

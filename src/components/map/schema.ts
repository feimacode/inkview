import { z } from "zod";

export const MAX_PLACES = 50;
/** Upper bound for servers that raise the place cap through the SDK. */
export const HARD_MAX_PLACES = 500;

const coordinate = (label: string, min: number, max: number) =>
  z
    .number({
      error: (issue) =>
        issue.input === undefined
          ? "Coordinates are required: every place needs lat and lng. Inkview does not look up addresses."
          : `${label} must be a number between ${min} and ${max}.`,
    })
    .min(min, `${label} must be at least ${min}.`)
    .max(max, `${label} must be at most ${max}.`);

const place = z.looseObject({
  id: z.string().min(1).max(60).optional().describe("Stable id for this place, unique within the map."),
  label: z.string().min(1).max(120).describe("Name shown on the pin and in the list."),
  lat: coordinate("Latitude", -90, 90).describe("WGS84 latitude in decimal degrees."),
  lng: coordinate("Longitude", -180, 180).describe("WGS84 longitude in decimal degrees."),
  detail: z.string().max(600).optional().describe("One or two sentences shown when the place is selected."),
  category: z.string().min(1).max(60).optional().describe("Short group such as Restaurant, Office or Venue."),
  address: z.string().max(200).optional().describe("Street address, when you know it."),
  url: z.string().url().optional().describe("Page with more about this place."),
});

export function mapSchema(maxPlaces = MAX_PLACES) {
  return z.looseObject({
    title: z.string().min(1).max(120).optional().describe("Heading above the map."),
    caption: z.string().max(300).optional().describe('Short note under the map, e.g. "12 of 40 places".'),
    places: z
      .array(place)
      .min(1)
      .max(maxPlaces, `Send the ${maxPlaces} most relevant places and state the total in caption.`)
      .describe(`1 to ${maxPlaces} places, each with a label and WGS84 coordinates.`),
    source: z.looseObject({ name: z.string().max(80), url: z.string().url().optional() }).optional(),
  });
}

export const schema = mapSchema();

export type MapData = z.infer<typeof schema>;
export type MapPlace = MapData["places"][number];

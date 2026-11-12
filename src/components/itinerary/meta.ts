import type { ComponentMeta } from "../types.js";

export const meta: ComponentMeta = {
  component: "itinerary",
  tool: "show_itinerary",
  title: "Show itinerary",
  schemaVersion: "1",
  description:
    "Display a day-by-day plan of ordered stops with times, costs and a map for each day; the user can reorder, move or remove stops and add the plan to a calendar. Use it when the answer is a trip or outing planned by day: a city break, a road trip, a weekend with friends. Each day has stops in visit order; a stop needs a title and can have time and endTime (24-hour HH:MM, local to the place), kind, note, cost, lat and lng, address, url and travel (how to get there from the previous stop, as text). Give days a date (YYYY-MM-DD) when you know it. Pass only places, times and prices you have; Inkview does not look anything up. Pass source with retrievedAt, and list in a stop's unverified the fields you did not fetch (for example [\"cost\"]). Send at most 14 days of 12 stops. After calling it, add at most one sentence.",
};

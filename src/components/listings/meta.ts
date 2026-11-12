import type { ComponentMeta } from "../types.js";

export const meta: ComponentMeta = {
  component: "listings",
  tool: "show_listings",
  title: "Show listings",
  schemaVersion: "1",
  description:
    "Display places, services, stays, events or homes as cards with price, rating, badges, distance and Call, Open at site and Directions actions; the user can sort, shortlist, and switch to a map when listings have coordinates. Use it when the user is choosing somewhere to go, stay or book, or someone to hire: hotels, restaurants, plumbers, venues, events, rentals. Use show_products instead for goods bought from a store. Pass only what your source gave: never invent prices, ratings, badges, phone numbers, links or coordinates, and leave a field out when you do not have it. Set asOf to when you looked the data up, give each listing its own source when they come from different sites, and list in unverified the fields you did not fetch (for example [\"price\"]). Inkview never books or pays; actions only link out or dial. Send at most 20 listings. After calling it, add at most one sentence.",
};

import type { ComponentMeta } from "../types.js";

export const meta: ComponentMeta = {
  component: "map",
  tool: "show_map",
  title: "Show map",
  schemaVersion: "1",
  description:
    "Display places on an interactive map with pins, a linked list and details. Use it when places have coordinates and their relative location matters: restaurants, offices, venues, stops or a short route. Every place needs a label and numeric lat and lng: find or ask for coordinates first, because Inkview does not look up addresses. Places can also have detail, category, address, url and id. Send at most 50 places: pick the most relevant and state the total in caption. After calling it, add at most one sentence.",
};

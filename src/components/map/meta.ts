import type { ComponentMeta } from "../types.js";

export const meta: ComponentMeta = {
  component: "map",
  tool: "show_map",
  title: "Show map",
  schemaVersion: "1",
  description:
    "Display places on an interactive map with pins, a linked list and details. Use it when the relative location of places matters: restaurants, offices, venues, stops or a short route. Every place needs a label; pass numeric lat and lng whenever you have them, because only places with coordinates get a pin and Inkview does not look up addresses. A place with only an address is listed as not on the map. Places can also have detail, category, url, id and pinLabel (up to 8 characters on the pin, such as a price). Send at most 50 places: pick the most relevant and state the total in caption. After calling it, add at most one sentence.",
};

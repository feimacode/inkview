import type { ComponentMeta } from "../types.js";

export const meta: ComponentMeta = {
  component: "entity_card",
  tool: "show_entity_card",
  title: "Show entity card",
  schemaVersion: "1",
  description:
    "Display one company, organization or place as a card with logo, key facts and links. Use it when your answer is about a single organization or place (a startup, a university, a venue, a city) and you have a few facts about it. For a person use show_profile_card instead. Pass only facts you gathered; never invent a logo URL. Pass phone and address when you have them to get Call and Directions actions. Pass source with retrievedAt (when you fetched the data), and list in unverified the fields you did not fetch. Inkview never books or pays. After calling it, add at most one sentence.",
};

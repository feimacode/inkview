import type { ComponentMeta } from "../types.js";

export const meta: ComponentMeta = {
  component: "entity_card",
  tool: "show_entity_card",
  title: "Show entity card",
  schemaVersion: "1",
  description:
    "Display one company, organization or place as a card with logo, key facts and links. Use it when your answer is about a single organization or place (a startup, a university, a venue, a city) and you have a few facts about it. For a person use show_profile_card instead. Pass only facts you gathered; never invent a logo URL. After calling it, add at most one sentence.",
};

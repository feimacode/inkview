import type { ComponentMeta } from "../types.js";

export const meta: ComponentMeta = {
  component: "profile_card",
  tool: "show_profile_card",
  title: "Show profile card",
  schemaVersion: "1",
  description:
    "Display one person as a visual profile card in the chat. Use it when your answer is about a single person (a candidate, a speaker, a founder, a contact) and you have at least their name plus a headline or a few facts. For two or more people, use show_profiles instead: it lays them out in a selectable grid. Pass only data you already gathered from your tools or the conversation; never invent a photo URL or links. After calling it, add at most one sentence of commentary; do not repeat the card's contents.",
};

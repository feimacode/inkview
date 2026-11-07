import type { ComponentMeta } from "../types.js";

export const meta: ComponentMeta = {
  component: "profile_grid",
  tool: "show_profiles",
  title: "Show profiles",
  schemaVersion: "1",
  description:
    "Display 2 to 24 people as a responsive grid of compact profile cards in the chat, using the same person fields as the profile card. Use it whenever your answer covers several people (candidates, speakers, attendees, contacts) and you have at least their names: the user can select people, ask about them, add them to a shortlist, or open one full profile. For a single person, use show_profile_card instead. Pass only data you already gathered from your tools or the conversation; never invent a photo URL or links. After calling it, add at most one sentence.",
};

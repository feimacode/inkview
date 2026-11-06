/** All component examples, for the preview gallery and render tests. */
import type { Example } from "./types.js";
import profileCard from "./profile-card/examples.json";

export const examples: Record<string, { tool: string; component: string; examples: Example[] }> = {
  profile_card: { tool: "show_profile_card", component: "profile_card", examples: profileCard as Example[] },
};

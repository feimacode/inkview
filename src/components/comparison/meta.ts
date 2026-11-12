import type { ComponentMeta } from "../types.js";

export const meta: ComponentMeta = {
  component: "comparison",
  tool: "show_comparison",
  title: "Show comparison",
  schemaVersion: "1",
  description:
    "Display 2 to 5 options side by side across the same criteria, with an optional recommendation, so the user can choose. Use it when the user is deciding between products, plans, tools, vendors or candidates. values[i][j] is item i's value for criterion j: text, a number, true/false, a rating object {\"rating\": 1-5}, or a journey {\"type\": \"journey\", \"segments\": [{from, to, depart, arrive, carrier}], \"durationMinutes\"} for a flight, train or bus trip. Pass only values you found. Give an option a url to add an Open at site action, and its own source when options come from different sites; in an option's unverified, list the criteria whose values you did not fetch. For more than 5 items use show_table. After calling it, add at most one sentence.",
};

import type { ComponentMeta } from "../types.js";

export const meta: ComponentMeta = {
  component: "comparison",
  tool: "show_comparison",
  title: "Show comparison",
  schemaVersion: "1",
  description:
    "Display 2 to 5 options side by side across the same criteria, with an optional recommendation, so the user can choose. Use it when the user is deciding between products, plans, tools, vendors or candidates. values[i][j] is item i's value for criterion j: text, a number, true/false, or a rating object {\"rating\": 1-5}. Pass only values you found. For more than 5 items use show_table. After calling it, add at most one sentence.",
};

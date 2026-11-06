import type { ComponentMeta } from "../types.js";

export const meta: ComponentMeta = {
  component: "chart",
  tool: "show_chart",
  title: "Show chart",
  schemaVersion: "1",
  description:
    "Display numbers as a line chart (values over time) or bar chart (values across categories), with up to 5 series and 100 points. Use it when you have numeric data the user will understand faster as a picture: prices over time, revenue by quarter, scores by team. x holds the labels or ISO dates; each series has one value per x (null for gaps). Pass only numbers you found or computed. After calling it, add at most one sentence.",
};

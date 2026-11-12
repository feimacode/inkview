import type { ComponentMeta } from "../types.js";

export const meta: ComponentMeta = {
  component: "data_table",
  tool: "show_table",
  title: "Show table",
  schemaVersion: "1",
  description:
    "Display records that share the same fields as an interactive table (sort, filter, select rows, CSV download). Use it when you have 3 or more items with the same attributes, such as search results with prices, a list of companies with metrics, or rows from a spreadsheet. Send at most 50 rows: pick the most relevant and state the total in caption. Give each column a type (text, number, money, date, link, badge, journey). For flights, trains and buses use a journey column ({segments: [{from, to, depart, arrive, carrier}], durationMinutes}) next to a money column for the price; pass durationMinutes when your source states the duration. Pass only values you have; never invent them. After calling it, add at most one sentence.",
};

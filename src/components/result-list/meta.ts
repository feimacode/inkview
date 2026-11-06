import type { ComponentMeta } from "../types.js";

export const meta: ComponentMeta = {
  component: "result_list",
  tool: "show_results",
  title: "Show search results",
  schemaVersion: "1",
  description:
    "Display ranked search or document results as a list with titles, sources, dates and snippets, each with Open and Dig deeper actions. Use it after a web, news, paper or document search when you want the user to scan several results (up to 20), in your ranking order. Pass only results your tools returned, with their real URLs. After calling it, add at most one sentence.",
};

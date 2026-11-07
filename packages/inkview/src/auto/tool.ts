/** The show_auto render tool: detection + validation against the chosen component's schema. */
import { z } from "zod";
import { serverComponents } from "../../../../src/components/server-registry.js";
import { detect } from "./detect.js";

export const MAX_AUTO_BYTES = 100 * 1024;

export const autoMeta = {
  tool: "show_auto",
  title: "Show data (auto)",
  description:
    "Display any JSON data with the best matching Inkview component, picked from its shape: products become a product grid, search results a result list, places with coordinates a map, dated events a timeline, items with a status a task list, numeric series a chart, two or more people a profile grid, a person a profile card, a company or place an entity card, same-shaped records a table, anything else formatted text. Prefer the specific show_* tool when you know which component fits; use this when you are unsure. Optional hint names a component (table, chart, map, timeline, tasks, profiles, profile, entity, results, products). Pass only data you have.",
};

export const autoSchema = z.looseObject({
  data: z.unknown().describe("The data to display: any JSON object or array."),
  hint: z.string().max(40).optional().describe("Preferred component: table, chart, map, timeline, tasks, profiles, profile, entity, results or products."),
});

export interface AutoResult {
  component: string | null;
  tool: string | null;
  data: Record<string, unknown> | null;
  /** Server settings for the chosen component, such as the map's tile provider. */
  config?: unknown;
  text: string;
}

export function runAuto(args: { data?: unknown; hint?: string }): AutoResult {
  const size = JSON.stringify(args.data ?? null).length;
  if (size > MAX_AUTO_BYTES) {
    throw new Error(`data is ${Math.round(size / 1024)} KB; show_auto accepts at most 100 KB. Send a smaller selection, such as the top rows.`);
  }
  const d = detect(args.data, args.hint);
  const entry = d && serverComponents.find((c) => c.meta.component === d.component);
  if (d && entry) {
    const parsed = entry.schema.safeParse(d.data);
    if (parsed.success) {
      const note = d.note ? ` (${d.note})` : "";
      return {
        component: entry.meta.component,
        tool: entry.meta.tool,
        data: parsed.data,
        config: entry.config?.(),
        text: `Shown with ${entry.meta.tool}${note}. Next time call ${entry.meta.tool} directly.\n\n${entry.toMarkdown(parsed.data)}`,
      };
    }
  }
  return {
    component: null,
    tool: null,
    data: null,
    text: `No specific component matched, so the data is shown as text.\n\n${"```json"}\n${JSON.stringify(args.data, null, 2).slice(0, 20000)}\n${"```"}`,
  };
}

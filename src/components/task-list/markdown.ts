import { mdSource } from "../md.js";
import type { TaskList } from "./schema.js";

export function toMarkdown(list: TaskList): string {
  const lastStatus = list.statuses[list.statuses.length - 1];
  const blocks: string[] = [];
  for (const status of list.statuses) {
    const items = list.items.filter((item) => item.status === status);
    if (!items.length) continue;
    blocks.push(
      [
        `#### ${status}`,
        ...items.map((item) => {
          const title = item.url ? `[${item.title}](${item.url})` : item.title;
          const details = [item.owner, item.due ? `due ${item.due}` : ""].filter(Boolean).join(" · ");
          return `- [${status === lastStatus ? "x" : " "}] ${title}${details ? ` — ${details}` : ""}`;
        }),
      ].join("\n"),
    );
  }
  const parts: string[] = [];
  if (list.title) parts.push(`### ${list.title}`);
  parts.push(...blocks);
  const source = mdSource(list.source);
  if (source) parts.push(source);
  return parts.join("\n\n");
}

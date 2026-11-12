import { mdChecked, mdProvenance } from "../../runtime/provenance.js";
import type { ResultList } from "./schema.js";

export function toMarkdown(r: ResultList): string {
  const head = r.title ? `### ${r.title}\n\n` : r.query ? `Results for **${r.query}**\n\n` : "";
  const provenance = mdProvenance({ items: r.results });
  return (
    head +
    r.results
      .map((x, i) => {
        const meta = [x.source, x.date].filter(Boolean).join(" · ");
        return `${i + 1}. [${x.title}](${x.url})${meta ? ` — ${meta}` : ""}${x.snippet ? `\n   ${mdChecked(x, "snippet", x.snippet)}` : ""}`;
      })
      .join("\n") +
    (provenance ? `\n\n${provenance}` : "")
  );
}

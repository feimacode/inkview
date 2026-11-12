import { mdProvenance, type SourceLike } from "../runtime/provenance.js";
/** Helpers for markdown fallbacks. */
export const mdCell = (v: unknown): string =>
  (v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v)).replace(/\|/g, "\\|").replace(/\n/g, " ");

export function mdTable(headers: string[], rows: unknown[][]): string {
  return [
    `| ${headers.map(mdCell).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((r) => `| ${r.map(mdCell).join(" | ")} |`),
  ].join("\n");
}

export const mdSource = (source?: SourceLike) => mdProvenance({ source });

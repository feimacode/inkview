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

export const mdSource = (s?: { name: string; url?: string }) =>
  s ? `_Source: ${s.url ? `[${s.name}](${s.url})` : s.name}_` : "";

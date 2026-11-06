import { metaEntries } from "./format.js";
import type { DocumentDraft } from "./schema.js";

export function toMarkdown(doc: DocumentDraft): string {
  const parts: string[] = [];
  if (doc.title) parts.push(`### ${doc.title}`);
  const entries = metaEntries(doc.kind, doc.meta);
  if (entries.length) parts.push(entries.map(([label, value]) => `- **${label}:** ${value}`).join("\n"));
  parts.push(doc.body);
  return parts.join("\n\n");
}

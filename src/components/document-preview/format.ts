/** Display helpers shared by the markdown fallback and the view. */

export const KIND_LABEL: Record<string, string> = {
  email: "Email",
  message: "Message",
  post: "Post",
  letter: "Letter",
  report: "Report",
  other: "Document",
};

const EMAIL_FIELDS = ["to", "cc", "subject"];

export function labelOf(key: string): string {
  return key ? key[0].toUpperCase() + key.slice(1) : key;
}

/** Metadata rows in display order: To, Cc and Subject first for email drafts. */
export function metaEntries(kind: string | undefined, meta: Record<string, string> | undefined): Array<[string, string]> {
  if (!meta) return [];
  const entries = Object.entries(meta);
  if (kind !== "email") return entries.map(([key, value]) => [labelOf(key), value]);
  const first = EMAIL_FIELDS.filter((key) => meta[key] != null).map((key): [string, string] => [labelOf(key), meta[key]]);
  const rest = entries.filter(([key]) => !EMAIL_FIELDS.includes(key)).map(([key, value]): [string, string] => [labelOf(key), value]);
  return [...first, ...rest];
}

/** What approval would do, phrased for the chat message. */
export function approveAction(kind: string | undefined): string {
  switch (kind) {
    case "post":
      return "publish this post";
    case "report":
      return "approve this report";
    case "letter":
      return "send this letter";
    case "message":
      return "send this message";
    case "email":
      return "send this email";
    default:
      return "approve this document";
  }
}

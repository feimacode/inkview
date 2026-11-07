import { z } from "zod";

export const MAX_BODY = 20000;
/** Upper bound for servers that raise the body cap through the SDK. */
export const HARD_MAX_BODY = 100000;
export const KINDS = ["email", "message", "post", "letter", "report", "other"] as const;

const meta = z
  .record(z.string(), z.string().min(1).max(300))
  .describe("For email: to, cc, subject. Otherwise up to 6 label/value pairs.");

export function documentPreviewSchema(maxBody = MAX_BODY) {
  return z
    .looseObject({
      title: z.string().min(1).max(200).optional().describe("Short name for the draft."),
      kind: z.enum(KINDS).optional().describe("Pick the header: email, message, post, letter, report or other."),
      body: z
        .string()
        .min(1)
        .max(maxBody, `The body is limited to ${maxBody.toLocaleString("en-US")} characters.`)
        .describe("The full draft as markdown."),
      meta: meta.optional(),
      limit: z.number().int().min(1).max(maxBody).optional().describe("Optional character limit for the destination."),
    })
    .superRefine((value, ctx) => {
      if (!value.meta) return;
      const keys = Object.keys(value.meta);
      if (keys.length > 6) {
        ctx.addIssue({ code: "custom", path: ["meta"], message: "Use at most 6 metadata fields." });
      }
      for (const key of keys) {
        if (!key.length || key.length > 40) {
          ctx.addIssue({ code: "custom", path: ["meta", key], message: "Metadata labels must be 1 to 40 characters." });
        }
      }
    });
}

export const schema = documentPreviewSchema();

export type DocumentDraft = z.infer<typeof schema>;

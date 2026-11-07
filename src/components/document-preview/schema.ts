import { z } from "zod";

export const MAX_BODY = 20000;
export const KINDS = ["email", "message", "post", "letter", "report", "other"] as const;

const meta = z
  .record(z.string(), z.string().min(1).max(300))
  .describe("For email: to, cc, subject. Otherwise up to 6 label/value pairs.");

export const schema = z
  .looseObject({
    title: z.string().min(1).max(200).optional().describe("Short name for the draft."),
    kind: z.enum(KINDS).optional().describe("Pick the header: email, message, post, letter, report or other."),
    body: z
      .string()
      .min(1)
      .max(MAX_BODY, `The body is limited to ${MAX_BODY.toLocaleString("en-US")} characters.`)
      .describe("The full draft as markdown."),
    meta: meta.optional(),
    limit: z.number().int().min(1).max(MAX_BODY).optional().describe("Optional character limit for the destination."),
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

export type DocumentDraft = z.infer<typeof schema>;

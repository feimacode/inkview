import { z } from "zod";

export const MAX_FIELDS = 12;
export const MAX_OPTIONS = 20;
export const FIELD_TYPES = ["text", "textarea", "number", "date", "select", "multiselect", "checkbox", "email", "url"] as const;

const SECRET_PATTERNS = [
  /\bpass(word|wd|code|phrase)\b/,
  /\b(card\s*(number|no|num)|credit\s*card|debit\s*card|cc\s*number)\b/,
  /\bcvv\d*\b|\bcvc\d*\b|\bsecurity\s*code\b/,
  /\bsocial\s*security\b|\bssn\b/,
  /\bnational\s*id\b|\bgovernment\s*id\b|\bpassport\b/,
];

/** Splits snake_case and camelCase, then looks for secret-shaped names. */
export function looksSecret(value: string): boolean {
  const normalized = value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .toLowerCase();
  return SECRET_PATTERNS.some((pattern) => pattern.test(normalized));
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

const field = z.looseObject({
  name: z
    .string()
    .min(1)
    .max(60)
    .regex(/^[A-Za-z0-9_-]+$/, "Use letters, numbers, underscores or dashes.")
    .describe("Stable key for the answer, unique within the form."),
  label: z.string().min(1).max(120).describe("The question shown above the control."),
  type: z.enum(FIELD_TYPES).describe("Control to render: text, textarea, number, date, select, multiselect, checkbox, email or url."),
  help: z.string().max(240).optional().describe("Short hint under the label."),
  required: z.boolean().optional().describe("The user must fill this field before submitting."),
  default: z
    .union([z.string(), z.number(), z.boolean(), z.array(z.string())])
    .optional()
    .describe("Initial value: text for text, textarea, date, select, email and url; a number for number; true or false for checkbox; option strings for multiselect."),
  min: z.union([z.number(), z.string()]).optional().describe("Lower bound for a number or a YYYY-MM-DD date."),
  max: z.union([z.number(), z.string()]).optional().describe("Upper bound for a number or a YYYY-MM-DD date."),
  options: z
    .array(z.string().min(1).max(80))
    .min(1)
    .max(MAX_OPTIONS, `Use at most ${MAX_OPTIONS} options.`)
    .optional()
    .describe("Choices for select and multiselect."),
});

function defaultIssue(value: z.infer<typeof field>): string | null {
  const fallback = value.default;
  if (fallback == null) return null;
  switch (value.type) {
    case "checkbox":
      return typeof fallback === "boolean" ? null : `Field "${value.label}" needs a true or false default.`;
    case "select":
      return typeof fallback === "string" && value.options?.includes(fallback)
        ? null
        : `Field "${value.label}" default must be one of its options.`;
    case "multiselect":
      return Array.isArray(fallback) && fallback.every((option) => value.options?.includes(option))
        ? null
        : `Field "${value.label}" default must list values from its options.`;
    case "number":
      return typeof fallback === "number" ? null : `Field "${value.label}" default must be a number.`;
    case "date":
      return typeof fallback === "string" && isIsoDate(fallback) ? null : `Field "${value.label}" default must be a date as YYYY-MM-DD.`;
    default:
      return typeof fallback === "string" ? null : `Field "${value.label}" default must be text.`;
  }
}

export const schema = z
  .looseObject({
    title: z.string().min(1).max(120).optional().describe("Heading above the form."),
    intro: z.string().min(1).max(400).optional().describe("One short sentence explaining why the form is shown."),
    submitLabel: z.string().min(1).max(40).optional().describe('Label for the submit button. Defaults to "Submit".'),
    fields: z
      .array(field)
      .min(1)
      .max(MAX_FIELDS, `Use at most ${MAX_FIELDS} fields.`)
      .describe("1 to 12 inputs, each with a name, label and type."),
  })
  .superRefine((value, ctx) => {
    const names = new Set<string>();
    value.fields.forEach((entry, index) => {
      const at = ["fields", index];

      if (names.has(entry.name)) {
        ctx.addIssue({ code: "custom", path: [...at, "name"], message: `Field name "${entry.name}" is used more than once.` });
      }
      names.add(entry.name);

      if (looksSecret(entry.name) || looksSecret(entry.label)) {
        ctx.addIssue({
          code: "custom",
          path: [...at, "name"],
          message: `Field "${entry.name}" cannot collect secrets because answers are visible in the chat.`,
        });
      }

      if ((entry.type === "select" || entry.type === "multiselect") && !entry.options?.length) {
        ctx.addIssue({
          code: "custom",
          path: [...at, "options"],
          message: `Field "${entry.label}" needs options because its type is ${entry.type}.`,
        });
      }

      const hasRange = entry.min != null || entry.max != null;
      if (hasRange && entry.type !== "number" && entry.type !== "date") {
        ctx.addIssue({
          code: "custom",
          path: [...at, "min"],
          message: `Only number and date fields can set min or max (field "${entry.label}").`,
        });
      }

      if (entry.type === "number") {
        for (const key of ["min", "max"] as const) {
          const bound = entry[key];
          if (bound != null && typeof bound !== "number") {
            ctx.addIssue({ code: "custom", path: [...at, key], message: `Field "${entry.label}" ${key} must be a number.` });
          }
        }
      }

      if (entry.type === "date") {
        for (const key of ["min", "max"] as const) {
          const bound = entry[key];
          if (bound != null && (typeof bound !== "string" || !isIsoDate(bound))) {
            ctx.addIssue({ code: "custom", path: [...at, key], message: `Field "${entry.label}" ${key} must be a date as YYYY-MM-DD.` });
          }
        }
      }

      if (entry.min != null && entry.max != null) {
        const reversed =
          entry.type === "number"
            ? Number(entry.min) > Number(entry.max)
            : entry.type === "date"
              ? String(entry.min) > String(entry.max)
              : false;
        if (reversed) {
          ctx.addIssue({ code: "custom", path: [...at, "min"], message: `Field "${entry.label}" min must not be greater than max.` });
        }
      }

      const issue = defaultIssue(entry);
      if (issue) ctx.addIssue({ code: "custom", path: [...at, "default"], message: issue });
    });
  });

export type FormData = z.infer<typeof schema>;
export type FormField = FormData["fields"][number];

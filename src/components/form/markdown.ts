import { typeHint } from "./format.js";
import type { FormData } from "./schema.js";

export function toMarkdown(form: FormData): string {
  const parts: string[] = [];
  if (form.title) parts.push(`### ${form.title}`);
  if (form.intro) parts.push(form.intro);

  parts.push(
    form.fields
      .map((field, index) => {
        const required = field.required ? " (required)" : "";
        const help = field.help ? ` ${field.help}` : "";
        return `${index + 1}. **${field.label}**${required} — ${typeHint(field)}.${help}`;
      })
      .join("\n"),
  );
  parts.push("Reply in chat with your answers.");

  return parts.join("\n\n");
}

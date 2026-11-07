import type { ComponentMeta } from "../types.js";

export const meta: ComponentMeta = {
  component: "form",
  tool: "show_form",
  title: "Show form",
  schemaVersion: "1",
  description:
    'Ask the user for several structured inputs at once with a short form and send their answers back. Use it when 3 or more inputs are missing and a form is faster than a back-and-forth. Provide 1 to 12 fields, each with a name, label and type: text, textarea, number, date, select, multiselect, checkbox, email or url. Each field can also have help, required, default, min and max; select and multiselect need 1 to 20 options. Never ask for passwords, payment card numbers, CVVs, social security numbers or national ID numbers: answers are visible in the chat, so the form rejects secrets. Ask only for details you will actually use. After calling it, add at most one sentence.',
};

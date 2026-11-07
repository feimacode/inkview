import { isIsoDate, type FormData, type FormField } from "./schema.js";

export type FormValue = string | boolean | string[];
export type FormValues = Record<string, FormValue>;

function text(value: FormValue): string {
  return typeof value === "string" ? value.trim() : "";
}

function isEmpty(field: FormField, value: FormValue): boolean {
  if (field.type === "checkbox") return value !== true;
  if (field.type === "multiselect") return !Array.isArray(value) || value.length === 0;
  return text(value) === "";
}

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function initialValues(fields: FormField[]): FormValues {
  const values: FormValues = {};
  for (const field of fields) {
    const fallback = field.default;
    if (field.type === "checkbox") {
      values[field.name] = fallback === true;
    } else if (field.type === "multiselect") {
      values[field.name] = Array.isArray(fallback) ? fallback.filter((option) => typeof option === "string") : [];
    } else {
      values[field.name] = fallback == null ? "" : String(fallback);
    }
  }
  return values;
}

function rangeHint(field: FormField, kind: "number" | "date"): string {
  const { min, max } = field;
  if (min != null && max != null) return ` from ${min} to ${max}`;
  if (min != null) return kind === "number" ? ` of at least ${min}` : ` from ${min}`;
  if (max != null) return ` up to ${max}`;
  return "";
}

export function typeHint(field: FormField): string {
  switch (field.type) {
    case "text":
      return "text";
    case "textarea":
      return "long text";
    case "number":
      return `number${rangeHint(field, "number")}`;
    case "date":
      return `date, YYYY-MM-DD${rangeHint(field, "date")}`;
    case "select":
      return `one of: ${(field.options ?? []).join(", ")}`;
    case "multiselect":
      return `one or more of: ${(field.options ?? []).join(", ")}`;
    case "checkbox":
      return "yes or no";
    case "email":
      return "email address";
    case "url":
      return "URL";
  }
}

function validateField(field: FormField, value: FormValue): string {
  if (isEmpty(field, value)) return field.required ? "Required" : "";

  switch (field.type) {
    case "number": {
      const number = Number(text(value));
      if (!Number.isFinite(number)) return "Enter a number.";
      const { min, max } = field;
      if (typeof min === "number" && typeof max === "number" && (number < min || number > max)) {
        return `Enter a number from ${min} to ${max}.`;
      }
      if (typeof min === "number" && number < min) return `Enter a number of at least ${min}.`;
      if (typeof max === "number" && number > max) return `Enter a number up to ${max}.`;
      return "";
    }
    case "date": {
      const date = text(value);
      if (!isIsoDate(date)) return "Enter a date as YYYY-MM-DD.";
      const { min, max } = field;
      if (typeof min === "string" && typeof max === "string" && (date < min || date > max)) {
        return `Enter a date from ${min} to ${max}.`;
      }
      if (typeof min === "string" && date < min) return `Enter a date on or after ${min}.`;
      if (typeof max === "string" && date > max) return `Enter a date on or before ${max}.`;
      return "";
    }
    case "email":
      return EMAIL.test(text(value)) ? "" : "Enter an email address.";
    case "url":
      return isHttpUrl(text(value)) ? "" : "Enter a URL starting with http:// or https://.";
    case "select":
      return field.options?.includes(text(value)) ? "" : "Choose one of the options.";
    case "multiselect": {
      const chosen = Array.isArray(value) ? value : [];
      return chosen.every((option) => field.options?.includes(option)) ? "" : "Choose only from the options.";
    }
    default:
      return "";
  }
}

export function validate(fields: FormField[], values: FormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const problem = validateField(field, values[field.name]);
    if (problem) errors[field.name] = problem;
  }
  return errors;
}

export function formatAnswer(field: FormField, value: FormValue): string {
  if (field.type === "checkbox") return value === true ? "Yes" : "No";
  if (field.type === "multiselect") {
    const chosen = Array.isArray(value) ? value : [];
    return chosen.length ? chosen.join(", ") : "None";
  }
  return text(value) || "—";
}

export function buildMessage(form: FormData, values: FormValues): string {
  const title = form.title ?? "Form answers";
  const lines = form.fields.map((field) => `${field.label}: ${formatAnswer(field, values[field.name])}`);
  return [title, "", ...lines].join("\n");
}

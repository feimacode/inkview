import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import "./form.css";
import { Button, useBusy } from "../../runtime/primitives.js";
import type { ViewProps } from "../types.js";
import { buildMessage, initialValues, validate, type FormValue } from "./format.js";
import type { FormData, FormField } from "./schema.js";

export function accepts(value: unknown): value is FormData {
  if (!value || typeof value !== "object") return false;
  const data = value as FormData;
  return Array.isArray(data.fields) && data.fields.every((field) => typeof field?.name === "string" && typeof field?.label === "string");
}

function RequiredMark() {
  return (
    <span className="fm-required" aria-hidden="true">
      {" *"}
    </span>
  );
}

export function View({ data, actions }: ViewProps<FormData>) {
  const uid = useId();
  const root = useRef<HTMLFormElement>(null);
  const focusFirstError = useRef(false);
  const [values, setValues] = useState(() => initialValues(data.fields));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sent" | "cancelled">("idle");
  const { busy, run } = useBusy();

  const locked = status !== "idle";
  const disabled = locked || busy !== null;

  const fieldId = (field: FormField) => `${uid}-${field.name}`;
  const describedBy = (field: FormField) => {
    const ids = [field.help ? `${fieldId(field)}-help` : "", errors[field.name] ? `${fieldId(field)}-error` : ""].filter(Boolean);
    return ids.length ? ids.join(" ") : undefined;
  };

  const change = (name: string, value: FormValue) => {
    setValues((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => {
      if (!previous[name]) return previous;
      const next = { ...previous };
      delete next[name];
      return next;
    });
  };

  useEffect(() => {
    if (!focusFirstError.current) return;
    const first = data.fields.find((field) => errors[field.name]);
    if (!first) return;
    focusFirstError.current = false;
    root.current?.querySelector<HTMLElement>(`[data-field="${first.name}"]`)?.focus();
  }, [errors, data.fields]);

  const submit = () => {
    if (disabled) return;
    const found = validate(data.fields, values);
    if (Object.keys(found).length > 0) {
      focusFirstError.current = true;
      setErrors(found);
      return;
    }
    setErrors({});
    void run("submit", async () => {
      await actions.sendMessage(buildMessage(data, values));
      setStatus("sent");
    });
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit();
  };

  const cancel = () => {
    void run("cancel", async () => {
      await actions.sendMessage(data.title ? `I declined the form "${data.title}".` : "I declined the form.");
      setStatus("cancelled");
    });
  };

  const common = (field: FormField) => ({
    id: fieldId(field),
    name: field.name,
    disabled,
    "aria-invalid": errors[field.name] ? true : undefined,
    "aria-describedby": describedBy(field),
    "aria-required": field.required ? true : undefined,
    "data-field": field.name,
  });

  const control = (field: FormField) => {
    const value = values[field.name];

    if (field.type === "textarea") {
      return (
        <textarea
          {...common(field)}
          className="fm-textarea"
          rows={3}
          value={String(value ?? "")}
          onChange={(event) => change(field.name, event.target.value)}
        />
      );
    }

    if (field.type === "select") {
      return (
        <select {...common(field)} className="fm-select" value={String(value ?? "")} onChange={(event) => change(field.name, event.target.value)}>
          <option value="">{field.required ? "Select…" : "None"}</option>
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    const type = field.type === "number" || field.type === "date" || field.type === "email" || field.type === "url" ? field.type : "text";
    return (
      <input
        {...common(field)}
        className="fm-input"
        type={type}
        value={String(value ?? "")}
        min={field.min}
        max={field.max}
        onChange={(event) => change(field.name, event.target.value)}
      />
    );
  };

  const help = (field: FormField) =>
    field.help ? (
      <p id={`${fieldId(field)}-help`} className="fm-help">
        {field.help}
      </p>
    ) : null;

  const error = (field: FormField) =>
    errors[field.name] ? (
      <p id={`${fieldId(field)}-error`} className="fm-error">
        {errors[field.name]}
      </p>
    ) : null;

  return (
    <form ref={root} className="ink-card fm" aria-label={data.title ?? "Form"} noValidate onSubmit={onSubmit}>
      {data.title ? <h2 className="ink-title fm-title">{data.title}</h2> : null}
      {data.intro ? <p className="fm-intro">{data.intro}</p> : null}

      <div className="fm-fields">
        {data.fields.map((field) => {
          if (field.type === "multiselect") {
            const chosen = Array.isArray(values[field.name]) ? (values[field.name] as string[]) : [];
            return (
              <div className="fm-field" key={field.name}>
                <fieldset className="fm-group" aria-describedby={describedBy(field)}>
                  <legend className="fm-legend">
                    {field.label}
                    {field.required ? <RequiredMark /> : null}
                  </legend>
                  <div className="fm-options">
                    {(field.options ?? []).map((option, index) => {
                      const optionId = `${fieldId(field)}-${index}`;
                      return (
                        <label className="fm-option" key={option} htmlFor={optionId}>
                          <input
                            id={optionId}
                            type="checkbox"
                            name={field.name}
                            value={option}
                            data-field={field.name}
                            disabled={disabled}
                            checked={chosen.includes(option)}
                            onChange={(event) =>
                              change(
                                field.name,
                                event.target.checked ? [...chosen, option] : chosen.filter((entry) => entry !== option),
                              )
                            }
                          />
                          <span>{option}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                {help(field)}
                {error(field)}
              </div>
            );
          }

          if (field.type === "checkbox") {
            return (
              <div className="fm-field" key={field.name}>
                <div className="fm-check">
                  <input
                    {...common(field)}
                    type="checkbox"
                    checked={values[field.name] === true}
                    onChange={(event) => change(field.name, event.target.checked)}
                  />
                  <label className="fm-label" htmlFor={fieldId(field)}>
                    {field.label}
                    {field.required ? <RequiredMark /> : null}
                  </label>
                </div>
                {help(field)}
                {error(field)}
              </div>
            );
          }

          return (
            <div className="fm-field" key={field.name}>
              <label className="fm-label" htmlFor={fieldId(field)}>
                {field.label}
                {field.required ? <RequiredMark /> : null}
              </label>
              {control(field)}
              {help(field)}
              {error(field)}
            </div>
          );
        })}
      </div>

      <div className="ink-actions fm-actions">
        {/* App iframes may be sandboxed without allow-forms, which blocks native submission. */}
        <button className="ink-btn ink-btn--primary" type="button" onClick={submit} disabled={disabled}>
          {busy === "submit" ? "Sending…" : (data.submitLabel ?? "Submit")}
        </button>
        <Button disabled={disabled} onClick={cancel}>
          {busy === "cancel" ? "Cancelling…" : "Cancel"}
        </Button>
        {locked ? (
          <span className={`fm-status${status === "cancelled" ? " fm-status--cancelled" : ""}`} role="status">
            {status === "sent" ? "Sent" : "Cancelled"}
          </span>
        ) : null}
      </div>
    </form>
  );
}

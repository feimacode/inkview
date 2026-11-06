/** Locale-aware formatting shared by components. */
export function fmtNumber(v: unknown, locale: string, opts?: Intl.NumberFormatOptions): string {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  if (Number.isNaN(n)) return v == null ? "" : String(v);
  try {
    return new Intl.NumberFormat(locale, opts).format(n);
  } catch {
    return String(n);
  }
}

export function fmtMoney(v: unknown, currency: string | undefined, locale: string): string {
  const n = toNumber(v);
  // Drop cents on large whole amounts (€1,200,000), keep them on prices ($349.00).
  const whole = n !== null && Number.isInteger(n) && Math.abs(n) >= 1000;
  const digits = whole ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  return fmtNumber(v, locale, currency ? { style: "currency", currency, ...digits } : digits);
}

export function fmtDate(v: unknown, locale: string): string {
  if (v == null || v === "") return "";
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return String(v);
  const hasTime = /T\d\d:\d\d/.test(String(v));
  try {
    return new Intl.DateTimeFormat(locale, hasTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }).format(d);
  } catch {
    return d.toDateString();
  }
}

export function toNumber(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  return Number.isNaN(n) ? null : n;
}

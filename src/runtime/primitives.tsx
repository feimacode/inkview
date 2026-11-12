/** Small building blocks shared by every component view. */
import { useState, type ReactNode } from "react";
import { ago, anyUnverified, collectSources, isStale, latestCheck, type ProvenanceInput } from "./provenance.js";

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/** Image that falls back to initials when missing, broken or blocked by CSP. */
export function Avatar({ src, name, shape = "circle", size = 64 }: { src?: string; name: string; shape?: "circle" | "square"; size?: number }) {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size, fontSize: Math.round(size / 2.9) };
  const cls = `ink-avatar ink-avatar--${shape}`;
  if (src && !failed) {
    return <img className={cls} style={style} src={src} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)} />;
  }
  return (
    <div className={cls} style={style} aria-hidden="true">
      {initials(name)}
    </div>
  );
}

export function Button({
  children,
  onClick,
  primary,
  disabled,
  pressed,
  label,
}: {
  children: ReactNode;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
  pressed?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      className={primary ? "ink-btn ink-btn--primary" : "ink-btn"}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      aria-label={label}
    >
      {children}
    </button>
  );
}

/** A link rendered as a button: navigation always goes through the host. */
export function HostLink({ href, children, open }: { href: string; children: ReactNode; open: (url: string) => void }) {
  return (
    <button type="button" className="ink-link" onClick={() => open(href)}>
      {children}
    </button>
  );
}

export function Chip({ children }: { children: ReactNode }) {
  return <span className="ink-chip">{children}</span>;
}

/** Marks a value the agent stated without fetching it. */
export function Unchecked({ on }: { on: boolean }) {
  return on ? (
    <span className="ink-unchecked" role="img" aria-label="not checked" title="Not checked against a source">
      {" ◦"}
    </span>
  ) : null;
}

/**
 * The provenance footer: where the data came from, when it was checked, and
 * whether some values were not checked. Draws nothing when it has nothing to say.
 */
export function Provenance({ source, items, asOf, sensitive, open, locale }: ProvenanceInput & { open: (url: string) => void; locale: string }) {
  const sources = collectSources(source, items);
  const checked = latestCheck(sources, asOf);
  const unchecked = anyUnverified(items ?? []);
  if (!sources.length && !sensitive && !unchecked) return null;
  return (
    <p className="ink-source">
      {sources.length ? "Source: " : sensitive ? "No source given" : ""}
      {sources.map((s, i) => (
        <span key={i}>
          {i > 0 && ", "}
          {s.url ? <HostLink href={s.url} open={open}>{s.name}</HostLink> : s.name}
        </span>
      ))}
      {checked !== undefined && ` · checked ${ago(checked, locale)}`}
      {sensitive && isStale(checked) && " · may have changed"}
      {unchecked && <span className="ink-source-key"> ◦ = not checked against a source</span>}
    </p>
  );
}

/** Runs an async action and exposes a busy flag, so buttons can't double-fire. */
export function useBusy() {
  const [busy, setBusy] = useState<string | null>(null);
  const run = async (key: string, fn: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(key);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };
  return { busy, run };
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

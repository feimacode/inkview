/** The shared hand-off action row: up to three buttons, the rest under "More". */
import { useRef, useState, type ReactNode } from "react";
import type { ViewActions } from "../components/types.js";
import { deriveActions, MAX_VISIBLE, type Handoff, type HandoffItem, type HandoffOptions } from "./handoff.js";
import { Button } from "./primitives.js";

/** Selects an element's text, so the user can copy it by hand. */
function selectText(el: HTMLElement | null) {
  if (!el) return;
  const range = document.createRange();
  range.selectNodeContents(el);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

/**
 * Copies to the clipboard. When the frame may not use the clipboard it
 * resolves "selected" after selecting `fallback`, the visible value.
 */
export async function copyText(value: string, fallback: () => HTMLElement | null): Promise<"copied" | "selected"> {
  try {
    if (typeof navigator.clipboard?.writeText !== "function") throw new Error("no clipboard");
    await navigator.clipboard.writeText(value);
    return "copied";
  } catch {
    selectText(fallback());
    return "selected";
  }
}

const ARIA: Record<Handoff["kind"], (name: string, a: Handoff) => string> = {
  open: (name) => `Open ${name} at site`,
  call: (name) => `Call ${name}`,
  directions: (name) => `Directions to ${name}`,
  calendar: (name) => `Add ${name} to calendar`,
  copy: (name, a) => `${a.label} of ${name}`,
};

export function Actions({
  item,
  actions,
  name,
  openLabel,
  openAria,
  copy,
  skip,
  children,
}: {
  item: HandoffItem;
  actions: ViewActions;
  /** Names the item in each button's accessible label; leave out on a single-entity card. */
  name?: string;
  openLabel?: string;
  /** Accessible label of the open action, when the default wording does not fit. */
  openAria?: string;
  copy?: HandoffOptions["copy"];
  skip?: HandoffOptions["skip"];
  /** Extra controls drawn after the buttons, e.g. a shortlist checkbox. */
  children?: ReactNode;
}) {
  const [more, setMore] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [manual, setManual] = useState<string | null>(null);
  const line = useRef<HTMLSpanElement>(null);
  const all = deriveActions(item, { canDownload: !!actions.download, openLabel, copy, skip });
  if (!all.length && !children) return null;

  const run = (a: Handoff) => {
    if (a.kind === "calendar") return void actions.download!(a.filename, "text/calendar", a.ics());
    if (a.kind !== "copy") return actions.openLink(a.url);
    // Show the value first: if the clipboard is blocked, it is selected for a manual copy.
    setManual(a.value);
    requestAnimationFrame(
      () =>
        void copyText(a.value, () => line.current).then((how) => {
          if (how === "copied") {
            setManual(null);
            setCopied(a.field);
          }
        }),
    );
  };
  const button = (a: Handoff, i: number) => (
    <Button
      key={a.kind === "copy" ? `copy-${a.field}` : a.kind}
      primary={i === 0 && (a.kind === "open" || a.kind === "call")}
      onClick={() => run(a)}
      label={a.kind === "open" && openAria ? openAria : name ? ARIA[a.kind](name, a) : undefined}
    >
      {a.kind === "copy" && copied === a.field ? "Copied" : a.label}
    </Button>
  );
  const shown = all.length > MAX_VISIBLE ? all.slice(0, MAX_VISIBLE) : all;
  const rest = all.slice(shown.length);
  return (
    <>
      {shown.map(button)}
      {rest.length > 0 && (
        <button type="button" className="ink-btn" aria-expanded={more} aria-label={name ? `More actions for ${name}` : undefined} onClick={() => setMore(!more)}>
          More
        </button>
      )}
      {children}
      {more && rest.length > 0 && <div className="ink-more">{rest.map((a, i) => button(a, shown.length + i))}</div>}
      {manual && (
        <p className="ink-copyline">
          <span ref={line}>{manual}</span> <span className="ink-faint">Selected: press Ctrl or ⌘ + C to copy.</span>
        </p>
      )}
    </>
  );
}

import type { ViewProps } from "../types.js";
import type { Comparison, Value } from "./schema.js";
import { Button, useBusy } from "../../runtime/primitives.js";
import { fmtNumber } from "../../runtime/format.js";
import { isJourney } from "../journey.js";
import { JourneyCell } from "../JourneyCell.js";
import "./comparison.css";

export function accepts(d: unknown): d is Comparison {
  const c = d as Comparison;
  return !!c && Array.isArray(c.items) && Array.isArray(c.criteria) && Array.isArray(c.values);
}

function Cell({ v, locale }: { v: Value | undefined; locale: string }) {
  if (v == null || v === "") return <span className="ink-faint" aria-label="No value">–</span>;
  if (typeof v === "boolean")
    return v ? (
      <span className="cmp-yes">✓ Yes</span>
    ) : (
      <span className="cmp-no">✕ No</span>
    );
  if (typeof v === "number") return <span className="cmp-num">{fmtNumber(v, locale)}</span>;
  if (isJourney(v)) return <JourneyCell journey={v} />;
  if (typeof v === "object") {
    const rating = (v as { rating: number }).rating;
    const r = Math.round(Math.max(0, Math.min(5, rating)));
    return (
      <span className="cmp-rating" role="img" aria-label={`${rating} out of 5`}>
        {"★".repeat(r)}
        <span className="cmp-rating-off">{"★".repeat(5 - r)}</span>
      </span>
    );
  }
  return <>{v}</>;
}

export function View({ data: c, actions }: ViewProps<Comparison>) {
  const { busy, run } = useBusy();
  const rec = c.items.findIndex((i) => i.name === c.recommended);
  const choose = (name: string) =>
    run(`choose:${name}`, () => actions.sendMessage(`I choose ${name}${c.title ? ` (from "${c.title}")` : ""}.`));

  return (
    <section className="ink-card cmp" aria-label={c.title ?? "Comparison"}>
      {c.title && <h2 className="ink-title">{c.title}</h2>}
      {rec >= 0 && c.reason && (
        <p className="cmp-reason">
          <strong>Recommended: {c.items[rec].name}.</strong> {c.reason}
        </p>
      )}
      {/* Wide layout: items as columns. */}
      <div className="cmp-wide">
        <table>
          <thead>
            <tr>
              <th scope="col">
                <span className="ink-sr">Criterion</span>
              </th>
              {c.items.map((it, i) => (
                <th key={it.name} scope="col" className={i === rec ? "cmp-rec" : undefined}>
                  {i === rec && <span className="cmp-badge">Recommended</span>}
                  <span className="cmp-item">{it.name}</span>
                  {it.subtitle && <span className="cmp-sub">{it.subtitle}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {c.criteria.map((cr, j) => (
              <tr key={cr}>
                <th scope="row">{cr}</th>
                {c.items.map((it, i) => (
                  <td key={it.name} className={i === rec ? "cmp-rec" : undefined}>
                    <Cell v={c.values[i]?.[j]} locale={actions.locale} />
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <th scope="row">
                <span className="ink-sr">Choose</span>
              </th>
              {c.items.map((it, i) => (
                <td key={it.name} className={i === rec ? "cmp-rec" : undefined}>
                  <Button primary={i === rec} disabled={busy !== null} label={`Choose ${it.name}`} onClick={() => choose(it.name)}>
                    Choose this
                  </Button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      {/* Narrow layout: one card per item. */}
      <div className="cmp-narrow">
        {c.items.map((it, i) => (
          <div key={it.name} className={`cmp-card${i === rec ? " cmp-rec" : ""}`}>
            {i === rec && <span className="cmp-badge">Recommended</span>}
            <h3 className="cmp-item">{it.name}</h3>
            {it.subtitle && <p className="cmp-sub">{it.subtitle}</p>}
            <dl>
              {c.criteria.map((cr, j) => (
                <div key={cr}>
                  <dt>{cr}</dt>
                  <dd>
                    <Cell v={c.values[i]?.[j]} locale={actions.locale} />
                  </dd>
                </div>
              ))}
            </dl>
            <Button primary={i === rec} disabled={busy !== null} label={`Choose ${it.name}`} onClick={() => choose(it.name)}>
              Choose this
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}

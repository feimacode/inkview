import { useState } from "react";
import type { ViewProps } from "../types.js";
import type { ResultList, Result } from "./schema.js";
import { Button, hostOf, Provenance, Unchecked, useBusy } from "../../runtime/primitives.js";
import { isUnverified } from "../../runtime/provenance.js";
import { fmtDate } from "../../runtime/format.js";
import { Actions } from "../../runtime/actions.js";
import "./result-list.css";

export function accepts(d: unknown): d is ResultList {
  return !!d && Array.isArray((d as ResultList).results);
}

function Favicon({ r }: { r: Result }) {
  const [failed, setFailed] = useState(false);
  if (r.faviconUrl && !failed) return <img className="rl-fav" src={r.faviconUrl} alt="" onError={() => setFailed(true)} />;
  return (
    <span className="rl-fav rl-fav--generic" aria-hidden="true">
      {hostOf(r.url)[0]?.toUpperCase() ?? "•"}
    </span>
  );
}

export function View({ data, actions }: ViewProps<ResultList>) {
  const { busy, run } = useBusy();
  return (
    <section className="ink-card rl" aria-label={data.title ?? "Search results"}>
      {(data.title || data.query) && (
        <h2 className="ink-title">{data.title ?? <>Results for “{data.query}”</>}</h2>
      )}
      <ol className="rl-list">
        {data.results.map((r, i) => (
          <li key={r.url + i} className="rl-item">
            <div className="rl-meta">
              <Favicon r={r} />
              <span>{r.source ?? hostOf(r.url)}</span>
              {r.date && <span className="ink-faint">· {fmtDate(r.date, actions.locale)}</span>}
            </div>
            <h3 className="rl-title">
              <button type="button" className="ink-link rl-open" onClick={() => actions.openLink(r.url)}>
                {r.title}
              </button>
            </h3>
            {r.snippet && (
              <p className="rl-snippet">
                {r.snippet}
                <Unchecked on={isUnverified(r, "snippet")} />
              </p>
            )}
            <div className="rl-actions">
              <Button
                disabled={busy !== null}
                label={`Dig deeper: ${r.title}`}
                onClick={() =>
                  run(`dig${i}`, () =>
                    actions.sendMessage(`Dig deeper into this result: "${r.title}" (${r.url}). Summarize what it says and what's notable.`),
                  )
                }
              >
                {busy === `dig${i}` ? "Asking…" : "Dig deeper"}
              </Button>
              <Actions item={r} actions={actions} name={r.title} copy={["link"]} skip={["open"]} />
            </div>
          </li>
        ))}
      </ol>
      <Provenance items={data.results} open={actions.openLink} locale={actions.locale} />
    </section>
  );
}

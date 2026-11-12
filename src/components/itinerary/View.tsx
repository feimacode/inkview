import { useMemo, useState } from "react";
import type { ViewProps } from "../types.js";
import type { MapConfig } from "../map/config.js";
import type { Itinerary, Stop } from "./schema.js";
import { Button, Chip, HostLink, Provenance, Unchecked, useBusy } from "../../runtime/primitives.js";
import { MapSurface } from "../map/Surface.js";
import { dayName, money, planText, timedStops, timeText, toIcs, totals } from "./format.js";
import { isUnverified } from "../../runtime/provenance.js";
import { fileSlug } from "../../runtime/ics.js";
import { mapsUrl } from "../../runtime/links.js";
import "./itinerary.css";

export function accepts(d: unknown): d is Itinerary {
  const plan = d as Itinerary;
  return !!plan && Array.isArray(plan.days) && plan.days.length > 0 && plan.days.every((day) => day && Array.isArray(day.stops));
}

type LiveStop = Stop & { key: string; moved?: boolean };
interface LiveDay {
  [key: string]: unknown;
  date?: string;
  label?: string;
  stops: LiveStop[];
}
interface State {
  days: LiveDay[];
  log: string[];
}
const KIND: Record<string, string> = { see: "◎ See", eat: "♨ Eat", stay: "⌂ Stay", travel: "➜ Travel" };
const hasPin = (s: Stop): s is LiveStop & { lat: number; lng: number } => typeof s.lat === "number" && typeof s.lng === "number";

function dateText(date: string | undefined, locale: string): string {
  const t = date ? Date.parse(date) : NaN;
  if (Number.isNaN(t)) return date ?? "";
  return new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(t);
}

export function View({ data, actions, config }: ViewProps<Itinerary, MapConfig>) {
  const { locale } = actions;
  const initial = useMemo<State>(
    () => ({ days: data.days.map((d, i) => ({ date: d.date, label: d.label, stops: d.stops.map((s, n) => ({ ...s, key: s.id ?? `${i}-${n}` })) })), log: [] }),
    [data],
  );
  const [history, setHistory] = useState<State[]>([]);
  const [fresh, setFresh] = useState(initial);
  const [day, setDay] = useState<number | null>(data.days.length > 1 ? 0 : null);
  const [picked, setPicked] = useState<string | null>(null);
  const [focus, setFocus] = useState<{ index: number; tick: number } | null>(null);
  const { busy, run } = useBusy();
  // A new tool result replaces the plan and its edits.
  const [seen, setSeen] = useState(initial);
  let state = fresh;
  if (seen !== initial) {
    setSeen(initial);
    setFresh(initial);
    setHistory([]);
    state = initial;
  }
  const { days, log } = state;

  const commit = (next: State, undo = false) => {
    setHistory((h) => (undo ? h.slice(0, -1) : [...h, state]));
    setFresh(next);
    void actions.setModelContext?.(
      next.log.length ? `The user edited the itinerary${data.title ? ` "${data.title}"` : ""}. Current order:\n${planText(next.days)}` : null,
    );
  };
  /** Moves a stop to a day and position, or removes it when `toDay` is null. */
  const edit = (from: number, index: number, toDay: number | null, toIndex: number, what: string) => {
    const next = days.map((d) => ({ ...d, stops: [...d.stops] }));
    const [stop] = next[from].stops.splice(index, 1);
    if (toDay !== null) next[toDay].stops.splice(toIndex, 0, { ...stop, moved: true });
    commit({ days: next, log: [...log, `${what.replace("%", `"${stop.title}"`)}`] });
  };

  const shown = day === null ? days.map((_, i) => i) : [day];
  const pins = shown.flatMap((d) =>
    days[d].stops.flatMap((s, n) =>
      hasPin(s) ? [{ key: s.key, lat: s.lat, lng: s.lng, name: s.title, text: day === null && days.length > 1 ? `${d + 1}.${n + 1}` : String(n + 1), on: picked === s.key }] : [],
    ),
  );
  const pick = (key: string) => {
    setPicked(key);
    const index = pins.findIndex((p) => p.key === key);
    if (index >= 0) setFocus({ index, tick: Date.now() });
  };

  const timed = timedStops(days).length;
  const tripTotal = totals(days.flatMap((d) => d.stops), locale);
  const send = () => run("send", () => actions.sendMessage(`I changed the plan:\n${log.map((l) => `- ${l}`).join("\n")}\n\nCurrent order:\n${planText(days)}\n\nPlease update the times to fit.`));
  const calendar = () =>
    run("ics", () => actions.download!(`${fileSlug(data.title ?? "", "itinerary")}.ics`, "text/calendar", toIcs(days)));

  return (
    <article className="ink-card it" aria-label={data.title ?? "Itinerary"}>
      {data.title && <h2 className="ink-title">{data.title}</h2>}
      {days.length > 1 && (
        <div className="it-days" role="group" aria-label="Days">
          {days.map((d, i) => (
            <Button key={i} pressed={day === i} onClick={() => setDay(i)}>
              Day {i + 1}
              {d.date && <span className="it-date"> · {dateText(d.date, locale)}</span>}
            </Button>
          ))}
          <Button pressed={day === null} onClick={() => setDay(null)}>
            All days
          </Button>
        </div>
      )}
      <div className={pins.length ? "mv-body" : "mv-body mv-body--list"}>
        {pins.length > 0 && <MapSurface pins={pins} config={config} onPick={(index) => setPicked(pins[index].key)} focus={focus} />}
        <div className="mv-side it-side">
          {shown.map((d) => {
            const total = totals(days[d].stops, locale);
            return (
              <section key={d} aria-label={dayName(days[d], d)}>
                <h3 className="it-day">
                  {dayName(days[d], d)}
                  {days[d].date && <span className="ink-muted it-date"> · {dateText(days[d].date, locale)}</span>}
                </h3>
                {!days[d].stops.length && <p className="ink-muted it-empty">No stops.</p>}
                <ol className="it-stops">
                  {days[d].stops.map((s, n) => (
                    <li key={s.key} className={picked === s.key ? "it-stop it-on" : "it-stop"}>
                      {s.travel && <p className="it-travel ink-muted">↓ {s.travel}</p>}
                      <div className="it-row">
                        <button type="button" className="it-pick" aria-pressed={picked === s.key} onClick={() => pick(s.key)} aria-label={`Show ${s.title} on the map`}>
                          {n + 1}
                        </button>
                        <div className="it-main">
                          <p className="it-title">
                            {timeText(s) && <span className="it-time">{timeText(s)} </span>}
                            {s.url ? <HostLink href={s.url} open={actions.openLink}>{s.title}</HostLink> : s.title}
                          </p>
                          {(s.note || s.address) && (
                            <p className="it-note ink-muted">
                              {[s.note, s.address].filter(Boolean).join(" · ")}
                              <Unchecked on={isUnverified(s, "address")} />
                            </p>
                          )}
                          {(s.address || hasPin(s)) && (
                            <p className="it-note">
                              <button type="button" className="ink-link" aria-label={`Directions to ${s.title}`} onClick={() => actions.openLink(mapsUrl({ label: s.title, lat: s.lat, lng: s.lng, address: s.address }))}>
                                Directions
                              </button>
                            </p>
                          )}
                          <p className="it-tags">
                            {s.kind && KIND[s.kind] && <Chip>{KIND[s.kind]}</Chip>}
                            {s.cost && (
                              <Chip>
                                {money(s.cost.amount, s.cost.currency, locale)}
                                <Unchecked on={isUnverified(s, "cost")} />
                              </Chip>
                            )}
                            {s.moved && s.time && <Chip>Time may need updating</Chip>}
                          </p>
                        </div>
                        <div className="it-edit">
                          <Button disabled={n === 0} onClick={() => edit(d, n, d, n - 1, `Moved % earlier on Day ${d + 1}`)} label={`Move ${s.title} earlier`}>
                            ↑
                          </Button>
                          <Button disabled={n === days[d].stops.length - 1} onClick={() => edit(d, n, d, n + 1, `Moved % later on Day ${d + 1}`)} label={`Move ${s.title} later`}>
                            ↓
                          </Button>
                          {days.length > 1 && (
                            <select
                              aria-label={`Move ${s.title} to another day`}
                              value=""
                              onChange={(e) => {
                                const to = Number((e.target as HTMLSelectElement).value);
                                edit(d, n, to, days[to].stops.length, `Moved % from Day ${d + 1} to Day ${to + 1}`);
                              }}
                            >
                              <option value="">Move to…</option>
                              {days.map((_, i) => i !== d && <option key={i} value={i}>{`Day ${i + 1}`}</option>)}
                            </select>
                          )}
                          <Button onClick={() => edit(d, n, null, 0, `Removed % from Day ${d + 1}`)} label={`Remove ${s.title}`}>
                            ✕
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
                {total && <p className="it-total">Day total: {total}</p>}
              </section>
            );
          })}
        </div>
      </div>
      {tripTotal && days.length > 1 && <p className="it-total it-trip">Trip total: {tripTotal}</p>}
      <div className="ink-actions">
        {history.length > 0 && <Button onClick={() => commit(history[history.length - 1], true)}>Undo</Button>}
        {log.length > 0 && (
          <Button primary disabled={busy !== null} onClick={send}>
            {busy === "send" ? "Sending…" : `Send changes (${log.length})`}
          </Button>
        )}
        {timed > 0 && actions.download && (
          <Button disabled={busy !== null} onClick={calendar}>
            Add to calendar
          </Button>
        )}
      </div>
      {timed > 0 && actions.download && <p className="ink-faint it-foot">Calendar times are local to each place.</p>}
      {data.caption && <p className="ink-faint it-foot">{data.caption}</p>}
      <Provenance source={data.source} items={days.flatMap((d) => d.stops)} sensitive open={actions.openLink} locale={locale} />
    </article>
  );
}

import { useMemo, useState } from "react";
import type { ViewProps } from "../types.js";
import type { Timeline } from "./schema.js";
import { formatTimelineDate, parseTimelineDate, sortByDate } from "./date.js";
import { Button, Source, useBusy } from "../../runtime/primitives.js";
import "./timeline.css";

export function accepts(d: unknown): d is Timeline {
  const timeline = d as Timeline;
  return (
    !!timeline &&
    typeof timeline === "object" &&
    Array.isArray(timeline.events) &&
    timeline.events.every(
      (event) => event && typeof event.title === "string" && typeof event.date === "string" && parseTimelineDate(event.date) !== null,
    )
  );
}

export function View({ data, actions }: ViewProps<Timeline>) {
  const [newestFirst, setNewestFirst] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());
  const { busy, run } = useBusy();
  const sorted = useMemo(() => sortByDate(data.events.map((event, index) => ({ ...event, index }))), [data.events]);
  const categories = useMemo(() => Array.from(new Set(data.events.flatMap((event) => (event.category ? [event.category] : [])))), [data.events]);
  const categoryColor = new Map(categories.map((category, index) => [category, index % 8]));
  const events = (newestFirst ? [...sorted].reverse() : sorted).filter((event) => !event.category || !hiddenCategories.has(event.category));
  const toggleCategory = (category: string) =>
    setHiddenCategories((current) => {
      const next = new Set(current);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  const toggleDetail = (index: number) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  return (
    <article className="ink-card tl" aria-label={data.title ?? "Timeline"}>
      <div className="tl-head">
        {data.title && <h2 className="ink-title">{data.title}</h2>}
        <Button onClick={() => setNewestFirst((value) => !value)}>{newestFirst ? "Newest first" : "Oldest first"}</Button>
      </div>
      {categories.length > 0 && (
        <div className="tl-legend" role="group" aria-label="Categories">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`tl-filter tl-c${categoryColor.get(category)}`}
              aria-pressed={!hiddenCategories.has(category)}
              onClick={() => toggleCategory(category)}
            >
              <span className="tl-swatch" aria-hidden="true" />
              {category}
            </button>
          ))}
        </div>
      )}
      <ol className="tl-events" aria-label="Timeline events">
        {events.map((event) => (
          <li
            key={event.index}
            className={`tl-event${event.category ? ` tl-c${categoryColor.get(event.category)}` : ""}`}
            data-date={event.date}
            data-category={event.category}
          >
            <span className="tl-dot" aria-hidden="true" />
            <div className="tl-meta">
              <time className="tl-date" dateTime={event.date}>
                {formatTimelineDate(event.date, actions.locale)}
              </time>
              {event.category && <span className="tl-category">{event.category}</span>}
            </div>
            <h3 className="tl-event-title">
              {event.detail ? (
                <button
                  type="button"
                  className="tl-expand"
                  aria-expanded={expanded.has(event.index)}
                  aria-controls={`tl-detail-${event.index}`}
                  onClick={() => toggleDetail(event.index)}
                >
                  {event.title}
                </button>
              ) : (
                event.title
              )}
            </h3>
            {event.detail && (
              <p id={`tl-detail-${event.index}`} className="tl-detail" hidden={!expanded.has(event.index)}>
                {event.detail}
              </p>
            )}
            <div className="tl-event-actions">
              <Button
                disabled={busy !== null}
                onClick={() =>
                  run(`more-${event.index}`, () => actions.sendMessage(`Tell me more about "${event.title}" dated ${event.date}.`))
                }
              >
                {busy === `more-${event.index}` ? "Asking…" : "Tell me more"}
              </Button>
              {event.url && <Button onClick={() => actions.openLink(event.url!)}>Open</Button>}
            </div>
          </li>
        ))}
      </ol>
      {events.length === 0 && <p className="tl-empty">No events to show.</p>}
      {data.caption && <p className="ink-faint tl-caption">{data.caption}</p>}
      <Source source={data.source} open={actions.openLink} />
    </article>
  );
}

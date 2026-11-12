import { dayMark, journeyFacts, journeyText, type Journey } from "./journey.js";
import "./journey.css";

const ICON: Record<string, string> = { flight: "✈", train: "🚆", bus: "🚌", ferry: "⛴" };

/** A journey drawn on two lines: times and places, then stops, duration and carriers. */
export function JourneyCell({ journey }: { journey: Journey }) {
  const f = journeyFacts(journey);
  const icon = ICON[journey.segments[0].mode ?? ""];
  return (
    <span className="jr">
      <span className="ink-sr">{journeyText(journey)}</span>
      <span aria-hidden="true">
        <span className="jr-times">
          {icon && `${icon} `}
          <b>{f.depart}</b> {f.from} → <b>{f.arrive}</b>
          {f.dayOffset !== 0 && <sup className="jr-day">{dayMark(f)}</sup>} {f.to}
        </span>
        <span className="jr-more">{[f.stops, f.duration, f.carriers].filter(Boolean).join(" · ")}</span>
      </span>
    </span>
  );
}

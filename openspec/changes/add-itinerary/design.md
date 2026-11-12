# Design

## Context

An itinerary is the first component that combines three existing patterns: a dated sequence (timeline), a map (map) and user edits reported to the agent (task list). See proposal.md for scope.

## Goals / Non-Goals

**Goals:**
- Readable with no coordinates, no times and no dates: a plan of "Day 1, Day 2" with titles only still works.
- Edits are small and safe: reorder, move, remove.

**Non-Goals:**
- A trip editor. Adding or rewriting stops goes through the agent.
- Travel time calculation.

## Decisions

**Days hold stops; a day has an optional `date` and optional `label`.** Without a date the day is "Day N". Stops have `title` required and optional `time`, `endTime` (24-hour `HH:MM`, local to the place), `kind` (see, eat, stay, travel, other), `note`, `cost` (`amount`, `currency`), `lat` and `lng`, `address`, `url`, and `travel` (free text for getting there from the previous stop, such as "15 min walk"). Travel is text the agent passes, never computed.

**Times are local wall-clock times with no time zone maths.** A trip crosses zones, and the agent's data rarely has offsets. Times display as given. The .ics file writes floating local times (no `TZID`, no `Z`), which calendars show at the same wall-clock time wherever the user is. Alternative: a per-day IANA time zone; rejected for now because a wrong zone silently shifts events, which is worse than floating.

**Per-day map with numbered pins.** Pins are numbered in stop order for the selected day; an "All days" view colours pins by day. No connecting lines, to avoid implying a route. Stops without coordinates are skipped on the map and keep their number in the list. If the day has no stop with coordinates, the map is hidden for that day.

**Edits: move up, move down, move to day, remove, undo.** Buttons, not drag and drop, so they work by keyboard and touch at 320 px. A stop that moves keeps its `time` but is flagged "time may need updating", since the view cannot know new timings. Every edit updates the model context with the full changed plan in compact form (day, order, title), and "Send changes" posts a message asking the agent to rework times around the new order. This follows the task list's reporting pattern, including the fallback to "Send changes" only when the host cannot update model context.

**Cost totals per currency.** Costs are summed per day and for the trip, one total per currency; no conversion.

**"Add to calendar" is an .ics download.** Offered when at least one stop has a `time` on a day with a `date`, and the host allows downloads. Each timed stop becomes an event with title, address or coordinates as location, note and link in the description. Stops without `endTime` get a 1-hour default. Text is escaped per RFC 5545 and lines folded at 75 octets.

**Caps: 14 days, 12 stops a day.** Enough for a two-week trip; larger plans should be sent in parts. The SDK can raise caps for self-hosters.

## Risks / Trade-offs

- [The agent and the view disagree about the plan after edits] → Model context always carries the whole current order, not a diff.
- [Floating times confuse users in another zone before travel] → The download note says times are local to each place.
- [Bundle budget] → Shared tile layer; the .ics writer is under 100 lines.
- [Hosts that block downloads] → The action is hidden, as with CSV export.

## Open Questions

- Should the view offer "Open day in maps" as a multi-stop directions link? It depends on a maps site's URL format, so it is left out for now.

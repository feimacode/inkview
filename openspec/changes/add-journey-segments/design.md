# Design

## Context

`show_table` formats cells by column type (text, number, money, date, link, badge) and `show_comparison` formats values by kind (boolean, rating, number, text). Both are implemented and in use; their specs are still in unarchived changes awaiting host checks. See proposal.md for scope.

## Goals / Non-Goals

**Goals:**
- One journey shape and one renderer for both tools.
- Never show a wrong duration.

**Non-Goals:**
- A `show_flights` tool.
- Time zone lookup from airport codes.

## Decisions

**A value type in existing tools, not a new tool.** A flight result is a table with one special cell. Keeping it in `show_table` gives sort, filter, select, "Ask about selected" and CSV for free, and `show_comparison` gives the finalists view with a recommendation. Alternative: `show_flights`; rejected because it adds a tool for one vertical and duplicates table features.

**Journey shape.** `{ segments: [{ from, to, depart, arrive, carrier?, number?, mode? }], durationMinutes? }` with 1 to 6 segments. `from` and `to` are short strings (a code such as SYD or a name, max 40 characters). `depart` and `arrive` are ISO 8601 local date-times, with a UTC offset when the agent has one. `mode` is flight, train, bus, ferry or other and picks the icon. In `show_comparison` the value is wrapped as `{ type: "journey", ... }` so it cannot be mistaken for other objects.

**Times display as local wall-clock times, exactly as passed.** No conversion to the user's zone: a 19:40 arrival in Tokyo reads 19:40.

**Duration is shown only when it is known.** Order of preference: `durationMinutes` when passed; otherwise computed from first `depart` and last `arrive` when both carry UTC offsets; otherwise not shown. Layover length follows the same rule per connection, and falls back to computing from local times only when the arriving and departing times are at the same place (same `to` and `from`), where the zone is the same. Alternative: guess zones from airport codes; rejected because it needs a data table and fails silently.

**Next-day mark from calendar dates.** "+1" (or "+2", "-1") is the difference between the arrival's and departure's local calendar dates, which needs no offsets.

**Sorting and filtering.** A journey column sorts by total duration, with journeys of unknown duration last. Filter text matches places, carriers and numbers. Sorting by departure time is left out to keep one meaning per header click.

**One text form everywhere.** The markdown fallback, CSV export and selection messages use the same line: `SYD 09:15 → NRT 19:40 (+1) · 1 stop SIN 2h 10m · 14h 25m · Singapore Airlines`. Parts that are unknown are left out.

**Narrow screens.** At 320 px the cell stacks into two lines (times and places, then stops and duration); in `show_comparison` it always stacks.

**Validation.** More than 6 segments, a missing `from`, `to`, `depart` or `arrive`, or an unparseable date-time rejects the call with a message naming the row and field. A segment whose `from` differs from the previous `to` is allowed and shown as a change of station or airport.

## Risks / Trade-offs

- [Agents pass durations that disagree with the times] → `durationMinutes` wins and is shown as passed; the description says to pass it only from the source.
- [Missing offsets hide the duration for most web-search data] → The description asks for `durationMinutes` whenever the source states a duration, which fare sites nearly always do.
- [Specs for both capabilities are not in `openspec/specs` yet] → Deltas are added requirements; archive order is stated in the proposal and tasks.

## Open Questions

- Should a journey cell carry its own `url` for "Open at airline", or is a separate link column enough? This design uses the link column.

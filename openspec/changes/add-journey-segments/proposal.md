# Proposal

## Why

Comparing flights is the most common consumer comparison in the research (2026-11-10), and trains and buses have the same shape. Today a flight in `show_table` or `show_comparison` is a row of loose text cells, so the things people decide on (how many stops, how long the layover, whether it lands the next day) are buried. A dedicated flight tool would add a tool for one vertical; a journey value type lets the two existing comparison tools show any trip leg.

## What Changes

- New `journey` column type in `show_table`: the cell value holds 1 to 6 segments (from, to, depart, arrive, optional carrier, number and mode) and optional total minutes.
- The same journey value is accepted as a cell value in `show_comparison`.
- A journey renders on one line: departure time and place, arrival time and place, a next-day mark, stop count with layover place and length, total duration and carriers.
- Journey columns sort by total duration, and a table filter matches place and carrier names.
- Markdown fallback and CSV export write a journey as one readable line.
- Tool descriptions and guidance tell agents to use a journey column plus a money column for flights, trains and buses.

Out of scope: fetching fares or schedules; booking or deep-linking into a booking flow beyond the row's own link column; seat maps, fare rules and baggage calculators (baggage can be a badge column); a price calendar chart (a separate chart change); computing durations from times that lack UTC offsets; airline logos.

## Capabilities

### New Capabilities

None.

### Modified Capabilities
- `data-table`: Adds the `journey` column type with its display, sorting, filtering and export. (This capability is still in the unarchived `add-data-table` change; the delta is written as added requirements so it applies once that change is archived.)
- `comparison`: Accepts a journey as a cell value. (Still in the unarchived `add-comparison` change; written as an added requirement for the same reason.)

## Impact

- A shared journey schema, formatter and cell view used by `src/components/data-table/` and `src/components/comparison/`.
- Tool descriptions for `show_table` and `show_comparison`, guidance and examples.
- Depends on `add-data-table` and `add-comparison` being archived before this change is archived, so the deltas have main specs to apply to.

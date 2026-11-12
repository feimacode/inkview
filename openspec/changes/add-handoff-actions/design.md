# Design

## Context

Listings (`src/components/listings/View.tsx`) already builds Open at site, Call (`tel:`), Directions (`mapsUrl` from `map/project.ts`, OpenStreetMap search) and a copy button for the phone. Itinerary builds an .ics with `toIcs` and the host's `downloadFile`. Entity card, product grid and comparison use `Button`/`HostLink` directly. `openLink` in `src/runtime/app.tsx` calls `app.openLink` and falls back to `window.open` for any URL. All URL fields use `z.string().url()`, which accepts `javascript:` and `data:` (checked with zod 4).

## Goals / Non-Goals

**Goals:**
- One place that decides which actions a card gets and in what order.
- Close the URL-scheme gap at both the schema and the runtime.
- Keep every existing action working the same way.

**Non-Goals:**
- New data fields beyond `phone` and `address` on the entity card.
- Share sheets, booking, payments.

## Decisions

1. **`deriveActions(item, caps)` returns a typed list** (`open | call | directions | calendar | copy`), and an `<Actions>` component renders it. Views pass their item and labels, for example "Open at store" for products. The alternative, a per-view helper, would bring back the drift this change removes.
2. **Overflow uses a disclosure button ("More") with a list of buttons**, not a custom menu role, to keep keyboard and screen-reader behaviour simple and inside the bundle budget.
3. **`httpUrl` schema** = `z.string().url()` refined to `https:`/`http:` protocol, exported from a new `src/components/fields.ts`. It replaces every URL field, including image URLs. `tel:` links are built from validated `phone`, never accepted as URLs.
4. **Runtime allowlist in `openLink`** as defence in depth, since SDK servers can register custom components.
5. **Directions keep OpenStreetMap search links**, matching the map's current OSM default. A future setting can point to other map providers.
6. **Calendar files reuse `toIcs`**, moved to `src/runtime/ics.ts`. A listing event without an end gets a 1-hour default, noted in the .ics description.

## Risks / Trade-offs

- [Tightening URL schemas could reject a legitimate non-http link] → Only `https`/`http` make sense for sites and images. `tel:`/`mailto:` come from dedicated fields.
- [Clipboard is often blocked in sandboxed frames] → Select-text fallback, as specified.
- [More buttons per card can crowd small frames] → Cap of 3 visible actions with overflow.

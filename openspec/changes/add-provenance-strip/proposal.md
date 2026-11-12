# Proposal

## Why

Inkview draws what the agent found as real cards, and a card looks trustworthy whether or not its price, phone number or opening state came from a real page. Users can't tell a fetched value from one the model recalled or guessed. Twelve components already accept an optional `source` with a name and link, but nothing says when the data was checked, nothing marks values the agent did not look up, and a card with no source looks the same as one with a source. This is the first phase-1 item of the agreed direction (Inkview as the renderer of the agent entrance, with trust built into every card).

## What Changes

- One shared provenance shape for every component: `source` gains an optional `retrievedAt` (ISO 8601). It keeps `name` and `url`, so existing calls stay valid.
- List-style components (listings, products, comparison options, results, itinerary stops, map pins) accept a per-item `source` when items come from different sites.
- Any item, or a single-entity component, may carry `unverified`: a list of field names the agent stated without fetching. Those values render with a visible "not checked" marker. They are never hidden or refused.
- One shared provenance footer replaces today's "Source: …" line. It shows the source names with links, "checked N ago" from `retrievedAt`, and a staleness note when price or availability data is more than 24 hours old.
- When a component that shows prices, ratings, phone numbers or availability is called with no source at all, the footer says "No source given".
- Markdown fallbacks carry the same information: source line, check time, and a "(not checked)" suffix on unverified values.
- Tool descriptions and the shared guidance tell agents to pass `source` and `retrievedAt`, and to list `unverified` fields instead of passing invented values.

Out of scope:
- Checking links or values in any way: Inkview still never fetches data. Provenance is what the agent declares.
- Link risk levels (a separate change once this lands).
- Reading schema.org JSON-LD from pages.
- Refusing calls that lack a source. Missing sources are shown, not rejected.

## Capabilities

### New Capabilities
- `provenance`: How every component accepts, shows and falls back on data sources, check times and values the agent did not verify.

### Modified Capabilities
<!-- None: existing component specs keep their requirements; the provenance capability applies across them. -->

## Impact

- New shared module `src/components/provenance.ts` (schema, helpers) replacing the duplicated `source` shapes in 12 schemas and `SourceSchema` in `person.ts`.
- `Source` primitive in `src/runtime/primitives.tsx` becomes `Provenance`; every view and markdown fallback that prints a source changes.
- Item schemas for listings, product grid, comparison, result list, itinerary and map gain optional `source` and `unverified`. This is additive, so it's no breaking change, and `result-list` keeps its existing string `source` publisher field.
- `src/guidance` text and generated plugin/ChatGPT docs (`npm run gen:guidance`).
- Server SDK (`packages/sdk`) re-exports the provenance schema.
- Small bundle growth, inside the 100 KB budget.

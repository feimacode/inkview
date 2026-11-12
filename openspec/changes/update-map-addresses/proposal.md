# Proposal

## Why

Consumer data usually arrives with addresses, not coordinates: a web search for plumbers or restaurants gives a street address, and only some results carry latitude and longitude. Today `show_map` rejects the whole call when one place lacks coordinates, so the agent falls back to plain text. The consumer research (2026-11-10) also found that stays and rentals need the price on the pin, not behind a click.

## What Changes

- `show_map` accepts a place that has an `address` but no `lat` and `lng`. Such places appear in the list marked "Not on map", and "Open in maps" searches for the address. **BREAKING** for callers that relied on the rejection: a call without coordinates now succeeds.
- A place with neither coordinates nor an address is still rejected.
- When no place has coordinates, the view shows the list with a short notice in place of the map.
- New optional `pinLabel` per place (up to 8 characters, such as "$210" or "4.8") drawn on the pin.
- The tool description tells agents to pass coordinates whenever they have them.

Out of scope: geocoding. Inkview still does not turn addresses into coordinates, because the project rule is that components only render data passed in and the hosted server makes no outbound data calls. The research doc recommended server-side geocoding; design.md records why this change does not do it and what a later opt-in change would need. Also out of scope: route lines, areas, clustering.

## Capabilities

### New Capabilities

None.

### Modified Capabilities
- `map`: Places may come with an address only, and pins may carry a short label.

## Impact

- `src/components/map/` schema, view, markdown fallback and examples.
- No new network calls, no CSP change, no privacy page change.
- `add-listings` and `add-itinerary` reuse the map and benefit from both changes, but do not depend on them.

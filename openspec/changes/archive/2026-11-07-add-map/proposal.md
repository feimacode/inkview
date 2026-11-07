# Proposal

## Why

Places are a common answer shape: restaurants near a hotel, store locations, venues on a trip, offices of a company. A list hides where things are relative to each other. The plan's v2 map shows places with coordinates, with zoom and selection.

## What Changes

- New render tool `show_map` for 1 to 50 places with latitude and longitude, a label and optional detail, category, address and link.
- An interactive map with pins, zoom and pan, fitted to the places; a linked list beside or below it.
- Select a place to see its detail; "Ask about selected" sends chosen places to the agent; "Open in maps" opens the place in a maps site through the host.
- Map tiles come from a configurable tile provider listed in the CSP; when tiles are blocked or turned off, pins draw on a plain grid so the component still works.
- The hosted privacy page states that the user's chat app loads map tiles from the provider.

Out of scope: routing and directions, geocoding addresses into coordinates (the agent must pass coordinates it has; Inkview never fetches), drawing areas or lines, clustering beyond 50 points, offline maps.

## Capabilities

### New Capabilities
- `map`: Shows places with coordinates on an interactive map with a linked list, via `show_map`.

### Modified Capabilities
- `hosted-server`: The privacy page names the map tile provider. (This capability is still in the unarchived `add-hosted-server` change; this delta is written as an added requirement so it applies once that change is archived.)

## Impact

- New folder `src/components/map/` with a small tile layer written in-house; no map library.
- Server config: a tile URL template and attribution added to the UI resource CSP (`resourceDomains`), set by environment variable.
- Decision needed before building: which tile provider (see design.md).

# Design

## Context

The map is the first component whose view loads third-party content that is not in the tool input (tiles), so it touches privacy, CSP and cost. See proposal.md for scope.

## Goals / Non-Goals

**Goals:**
- Fit the 100 KB gzipped shared bundle.
- Work, in a reduced form, when tiles cannot load.

**Non-Goals:**
- Vector tiles, 3D, satellite imagery.

## Decisions

**No map library; an in-house raster tile layer.** Web Mercator tile math, pan by drag and keys, zoom by buttons, wheel and pinch, fit-to-bounds. That is a few hundred lines. Alternatives: Leaflet (about 40 KB gzipped, plus CSS, would take close to half the budget), MapLibre GL (far over budget).

**Tile provider is configuration, not code.** `INKVIEW_MAP_TILES` holds a URL template and `INKVIEW_MAP_ATTRIBUTION` its credit line; the server adds the template's host to the UI resource CSP. `off` disables tiles. Self-hosters pick their own.

**Default for the hosted server: OpenStreetMap standard tiles until launch.**
1. OpenStreetMap's standard tiles. Free, but the OSMF tile usage policy forbids heavy use by apps and asks for a valid Referer, which sandboxed iframes may not send. Fine for testing, risky at directory scale.
2. A commercial provider's free tier (for example MapTiler, Stadia Maps or Thunderforest) with a key restricted by domain. Free at low volume, but the key is visible to users and host sandbox origins vary, so domain restriction may not hold.
3. Self-hosted raster tiles on the feimacode VM. Full control and no third party sees viewports, but storage and bandwidth grow with use.
Decision: ship with 1 (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`, attribution "© OpenStreetMap contributors") behind the config switch while Inkview is not listed in a directory, and move to 2 before directory submission. The switch means the change is deployment, not code.

**Fallback without tiles.** Pins are drawn on a neutral grid projected the same way, with the linked list unchanged, so the user still sees relative positions.

**"Open in maps" uses a plain search URL** (OpenStreetMap by default) with coordinates and label, opened through the host's `openLink`.

## Risks / Trade-offs

- [Tile requests reveal the viewed area to the tile provider] → State it on the privacy page; offer `off`; never send labels or other tool data in tile requests.
- [Hosts block the tile domain] → The fallback grid; render tests cover tiles blocked.
- [Provider terms change or the free tier ends] → Config switch, no code change.

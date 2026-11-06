# Tasks

## 0. Decision

- [ ] 0.1 Confirm the hosted tile provider with Iven (design.md); record it in design.md

## 1. Schema and server

- [ ] 1.1 Write the `map` schema (coordinate ranges, 50-place cap) and tool description with a "use when" line; verify the smoke test calls `show_map` with a valid payload and one without coordinates
- [ ] 1.2 Add `INKVIEW_MAP_TILES` and `INKVIEW_MAP_ATTRIBUTION`, adding the tile host to the CSP; verify a unit test of the resource metadata with tiles on and off
- [ ] 1.3 Write the markdown fallback; verify unit tests cover a full and a minimal payload
- [ ] 1.4 Add a situation line to guidance and regenerate; add 4 map prompts to `evals/prompts.json` for when evals resume; verify `npm test` passes the guidance check

## 2. View

- [ ] 2.1 Write the raster tile layer with fit-to-bounds, pan and zoom by pointer, touch and keyboard; verify render tests zoom by keyboard and that tile URLs hold only tile coordinates
- [ ] 2.2 Add pins, the linked list and detail; verify a render test selects from the list and from a pin
- [ ] 2.3 Add "Open in maps" and "Ask about selected"; verify the test host receives the link and the message
- [ ] 2.4 Add the neutral-grid fallback; verify a render test with tiles blocked
- [ ] 2.5 Add at least 3 examples to `examples.json` and render tests in light, dark and 320 px (with tiles stubbed); verify screenshots and the bundle size check pass

## 3. Hosting and docs

- [ ] 3.1 Update `docs/privacy.md` and `docs/self-hosting.md` for tiles; set the provider in the feima-infra role; verify the deployed CSP lists the tile host
- [ ] 3.2 Add the component to the README component list and gallery with a sample prompt; verify the prompt triggers `show_map` in Claude Desktop with tiles loading

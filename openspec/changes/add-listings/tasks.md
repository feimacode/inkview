# Tasks

## 1. Schema and server

- [x] 1.1 Write the `listings` schema (20-listing cap, price object, phone character rule, per-call and per-listing `kind`) and tool description with a "use when" line and "pass only what your source gave"; verify the smoke test calls `show_listings` with a full payload, a title-only payload and an unsafe phone value
- [x] 1.2 Write the markdown fallback; verify unit tests cover a full and a minimal payload
- [x] 1.3 Add situation lines to guidance (listings vs products) and regenerate the plugin Skill and ChatGPT doc; add 6 listing prompts to `evals/prompts.json` for when evals resume, 4 of them on the listings/products boundary; verify `npm test` passes the guidance check

## 2. View

- [x] 2.1 Build the card and responsive grid with kind-based labels, price and distance formatting and badge chips; verify render tests for each kind and for a title-only listing
- [x] 2.2 Add sorting by rating, distance and price with the shared currency-and-unit rule; verify render tests for each sort and for mixed units
- [x] 2.3 Add "Open at site", "Call" (with visible, copyable number) and "Directions"; verify the test host receives the link, the `tel:` link and the maps URL, and that a refused `tel:` leaves copy working
- [x] 2.4 Add selection with "Ask about selected" and "Compare selected"; verify the test host receives both messages
- [x] 2.5 Extract the map tile layer for reuse and add the grid/map toggle with shared selection and the "not on map" count; verify render tests with tiles stubbed, with tiles blocked, and that existing map tests still pass
- [x] 2.6 Add the snapshot notice and the `openNow` freshness rule; verify render tests with a fresh and a stale `asOf`
- [x] 2.7 Add at least 4 examples to `examples.json` (plumbers, hotels, restaurants, weekend events) and render tests in light, dark and 320 px; verify screenshots and the bundle size check pass

## 3. Docs

- [ ] 3.1 Add the component to the README component list and gallery with consumer sample prompts; verify a plumber prompt triggers `show_listings` in Claude Desktop

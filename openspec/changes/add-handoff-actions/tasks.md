# Tasks

## 1. Link safety

- [x] 1.1 Add `httpUrl` in `src/components/fields.ts` and use it for every URL field in all component schemas; verify a unit test rejects `javascript:` and `data:` URLs and accepts `https:`/`http:`
- [x] 1.2 Add the scheme allowlist to `openLink` in `src/runtime/app.tsx` (as `openSafely` in `src/runtime/links.ts`); verify unit tests for allowed schemes, a refused `javascript:` link, and the `https` window fallback

## 2. Shared action set

- [x] 2.1 Add `src/runtime/actions.tsx` (with `deriveActions` in `src/runtime/handoff.ts`, free of React so markdown fallbacks and the SDK can use it), `<Actions>` (order, cap of 3, "More" disclosure) and the clipboard helper with select-text fallback; move `mapsUrl` and `toIcs` into the runtime; verify unit tests for derivation, ordering and overflow
- [x] 2.2 Add a shared markdown helper that renders actions as links; verify cases in `test/unit/markdown.test.ts`

## 3. Components

- [x] 3.1 Listings: move to `<Actions>`, add Add to calendar for events and Copy address; land schema, markdown, view, examples and render tests together; verify the existing listings tests pass plus the new calendar and overflow scenarios (the stay and event label changed from "Book at site" to "Open at site" to meet the "No transactional actions" requirement, and the snapshot note lost its check time, which now sits in the provenance footer)
- [x] 3.2 Entity card: add optional `phone` and `address`, Call, Directions and Copy; land schema, markdown, view, examples and render tests; verify the "Entity card with phone and address" scenario
- [x] 3.3 Product grid and result list: add Copy link via `<Actions>`; verify render tests show it and existing actions still work
- [x] 3.4 Comparison: Open at site per option with `url`; verify a render test
- [x] 3.5 Itinerary: move .ics and links to the shared helpers, add Directions per stop with an address; verify the existing itinerary tests pass plus a directions test

## 4. Guidance, SDK and docs

- [x] 4.1 Update tool descriptions and guidance (actions come only from passed fields; never "Book"), run `npm run gen:guidance`; verify `test/unit/guidance.test.ts`
- [x] 4.2 Export `deriveActions`, `mdActions`, `canOpen` and `httpUrl` from `packages/sdk`; verify `test/unit/sdk.test.ts` (`<Actions>` stays in the shared view: the SDK is server-side and ships no React components)
- [x] 4.3 Document the actions per component in the README; verify the examples render in the preview gallery

## 5. Integration checks

- [x] 5.1 Run the full test suite and the bundle-size check; verify the bundle stays at or under 100 KB gzipped
- [ ] 5.2 Verify in Claude Desktop and ChatGPT web that Call, Directions and Add to calendar open through the host, and note any host that refuses `tel:` links in `docs/host-matrix.md`

## Workflow follow-up

- Archive the change after Iven confirms the host checks.

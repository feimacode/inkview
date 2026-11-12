# Tasks

## 1. Link safety

- [ ] 1.1 Add `httpUrl` in `src/components/fields.ts` and use it for every URL field in all component schemas; verify a unit test rejects `javascript:` and `data:` URLs and accepts `https:`/`http:`
- [ ] 1.2 Add the scheme allowlist to `openLink` in `src/runtime/app.tsx`; verify unit tests for allowed schemes, a refused `javascript:` link, and the `https` window fallback

## 2. Shared action set

- [ ] 2.1 Add `src/runtime/actions.tsx` with `deriveActions`, `<Actions>` (order, cap of 3, "More" disclosure) and the clipboard helper with select-text fallback; move `mapsUrl` and `toIcs` into the runtime; verify unit tests for derivation, ordering and overflow
- [ ] 2.2 Add a shared markdown helper that renders actions as links; verify cases in `test/unit/markdown.test.ts`

## 3. Components

- [ ] 3.1 Listings: move to `<Actions>`, add Add to calendar for events and Copy address; land schema, markdown, view, examples and render tests together; verify the existing listings tests pass unchanged plus the new calendar and overflow scenarios
- [ ] 3.2 Entity card: add optional `phone` and `address`, Call, Directions and Copy; land schema, markdown, view, examples and render tests; verify the "Entity card with phone and address" scenario
- [ ] 3.3 Product grid and result list: add Copy link via `<Actions>`; verify render tests show it and existing actions still work
- [ ] 3.4 Comparison: Open at site per option with `url`; verify a render test
- [ ] 3.5 Itinerary: move .ics and links to the shared helpers, add Directions per stop with an address; verify the existing itinerary tests pass plus a directions test

## 4. Guidance, SDK and docs

- [ ] 4.1 Update tool descriptions and guidance (actions come only from passed fields; never "Book"), run `npm run gen:guidance`; verify `test/unit/guidance.test.ts`
- [ ] 4.2 Export `deriveActions`, `<Actions>` and `httpUrl` from `packages/sdk`; verify `test/unit/sdk.test.ts`
- [ ] 4.3 Document the actions per component in the README; verify the examples render in the preview gallery

## 5. Integration checks

- [ ] 5.1 Run the full test suite and the bundle-size check; verify the bundle stays at or under 100 KB gzipped
- [ ] 5.2 Verify in Claude Desktop and ChatGPT web that Call, Directions and Add to calendar open through the host, and note any host that refuses `tel:` links in `docs/host-matrix.md`

## Workflow follow-up

- Archive the change after Iven confirms the host checks.

# Tasks

## 1. Shared provenance module

- [ ] 1.1 Add `src/components/provenance.ts` with `SourceSchema` (`name`, `url?`, `retrievedAt?` ISO 8601), `unverified` schema, `latestCheck()` and `isStale()` helpers; verify with new unit tests in `test/unit/provenance.test.ts` (valid/invalid `retrievedAt`, unknown `unverified` names ignored, 24-hour staleness boundary)
- [ ] 1.2 Replace the `Source` primitive with `Provenance` (sources list, relative check time, stale note, "No source given", marker legend) and add an `Unchecked` marker primitive with `aria-label="not checked"`; verify in the preview gallery in light and dark themes and with a keyboard/screen-reader pass
- [ ] 1.3 Add a shared markdown helper for the source line and the "(not checked)" suffix; verify with cases in `test/unit/markdown.test.ts`

## 2. Sensitive components (listings, product grid, comparison, entity card, itinerary, map)

- [ ] 2.1 Listings: per-item `source` and `unverified`, footer uses max of `retrievedAt` and `asOf`; land schema, markdown fallback, view, examples (one with mixed sources, one with an unverified price) and render tests together; verify the "Plumbers without a source" and "Price recalled, not fetched" scenarios pass
- [ ] 2.2 Product grid: same change; verify the "Day-old prices" scenario in a render test
- [ ] 2.3 Comparison: per-option `source` and `unverified`; verify a render test showing two option sources in the footer
- [ ] 2.4 Entity card: `unverified` on the card; verify a render test with an unverified phone fact
- [ ] 2.5 Itinerary and map: per-stop and per-pin `source` and `unverified`; verify render tests for both

## 3. Other components

- [ ] 3.1 Switch chart, data table, timeline, task list, profile card, profile grid and document preview to the shared `SourceSchema` and `Provenance` footer (footer only when a source is given); verify existing render tests still pass and one new test per component shows "checked N ago"
- [ ] 3.2 Result list: add item `sourceInfo` with the shared shape, keep the string `source`; verify a render test and that an existing call with string `source` still validates

## 4. Guidance, SDK and docs

- [ ] 4.1 Update tool descriptions and `packages/inkview/src/guidance` with the provenance instructions, run `npm run gen:guidance`; verify `test/unit/guidance.test.ts` checks for the `unverified` instruction
- [ ] 4.2 Re-export the provenance schema and helpers from `packages/sdk`; verify `test/unit/sdk.test.ts` imports them
- [ ] 4.3 Document provenance fields in the README component section and `docs/`; verify the documented example call validates against the schema in a unit test

## 5. Integration checks

- [ ] 5.1 Run the full test suite and the bundle-size check; verify the bundle stays at or under 100 KB gzipped
- [ ] 5.2 Verify in Claude Desktop that a listings call with sources, an unverified price and a 30-hour-old `retrievedAt` shows the marker, the footer and the stale note

## Workflow follow-up

- Archive the change after Iven confirms the Claude Desktop check.

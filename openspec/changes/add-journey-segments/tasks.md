# Tasks

## 1. Shared journey module

- [ ] 1.1 Write the journey schema (6-segment cap, required fields, ISO date-time parsing with optional offset) with row-and-field error messages; verify unit tests for valid, too many segments, missing field and bad date-time
- [ ] 1.2 Write the formatter: day offset from local dates, stop list, duration and layover rules (passed, offsets, same place, else unknown) and the one-line text form; verify unit tests for direct, one stop overnight, no offsets, and station change
- [ ] 1.3 Build the journey cell view with mode icon, wide and stacked layouts and accessible text equal to the one-line form; verify render tests in light, dark and 320 px

## 2. Table

- [ ] 2.1 Add the `journey` column type to the `show_table` schema and description; verify the smoke test calls `show_table` with a journey column and with a 7-segment journey
- [ ] 2.2 Sort by duration with unknown last and include places, carriers and numbers in the filter; verify render tests for sort and filter
- [ ] 2.3 Use the text form in the markdown fallback, CSV export and "Ask about selected"; verify unit tests and a render test of the CSV content
- [ ] 2.4 Add 2 examples to the table's `examples.json` (flights with prices; train options); verify screenshots and the bundle size check pass

## 3. Comparison

- [ ] 3.1 Accept `{ type: "journey" }` values in the `show_comparison` schema, render them stacked and write the text form in the markdown fallback; verify the smoke test, a render test with 3 finalists and a fallback unit test
- [ ] 3.2 Add 1 example to the comparison's `examples.json` (3 flight finalists with a recommendation); verify screenshots pass

## 4. Guidance and docs

- [ ] 4.1 Add guidance lines for flights, trains and buses (journey column plus money column; pass `durationMinutes` when the source states it) and regenerate; add 4 prompts to `evals/prompts.json` for when evals resume; verify `npm test` passes the guidance check
- [ ] 4.2 Update the README and gallery with a flight comparison sample prompt; verify the prompt renders journey cells in Claude Desktop
- [ ] 4.3 Archive `add-data-table` and `add-comparison` before archiving this change, so the deltas have main specs to apply to; verify `openspec validate --all --strict` passes after archiving

# Tasks

## 1. Schema and server

- [ ] 1.1 Write the `data-table` schema and tool description with a "use when" line; verify the smoke test calls `show_table` with a valid and an invalid payload
- [ ] 1.2 Write the markdown fallback; verify unit tests cover a full and a minimal payload

## 2. View

- [ ] 2.1 Render typed cells (text, number, money, date, link, badge) with locale formatting; verify render tests cover each type
- [ ] 2.2 Add column sorting and a text filter; verify render tests sort a number column and filter by text
- [ ] 2.3 Add row selection and "Ask about selected"; verify the test host receives a message naming the selected rows
- [ ] 2.4 Add CSV download, hidden when downloads are unsupported; verify the downloaded file matches the visible rows
- [ ] 2.5 Add a sticky first column and in-table horizontal scroll at narrow widths; verify the 320 px render has no page-level horizontal scroll
- [ ] 2.6 Add at least 3 examples to `examples.json` and render tests in light, dark and 320 px; verify screenshots and the bundle size check pass

## 3. Docs

- [ ] 3.1 Add the component to the README component list with a screenshot and sample prompt; verify the prompt triggers `show_table` in Claude Desktop

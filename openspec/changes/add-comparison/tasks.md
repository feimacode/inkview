# Tasks

## 1. Schema and server

- [ ] 1.1 Write the `comparison` schema and tool description with a "use when" line; verify the smoke test calls `show_comparison` with a valid and an invalid payload
- [ ] 1.2 Write the markdown fallback; verify unit tests cover a full and a minimal payload

## 2. View

- [ ] 2.1 Render items as columns with typed values, collapsing to stacked cards per item under 480 px; verify render tests at desktop and 320 px
- [ ] 2.2 Highlight the recommended item and show its reason; verify the render test finds the marker
- [ ] 2.3 Add "Choose this"; verify the test host receives the choice message
- [ ] 2.4 Add at least 3 examples to `examples.json` and render tests in light, dark and 320 px; verify screenshots and the bundle size check pass

## 3. Docs

- [ ] 3.1 Add the component to the README component list with a screenshot and sample prompt; verify the prompt triggers `show_comparison` in Claude Desktop

# Tasks

## 1. Schema and server

- [ ] 1.1 Write the `chart` schema and tool description with a "use when" line; verify the smoke test calls `show_chart` with a valid and an invalid payload
- [ ] 1.2 Write the markdown fallback; verify unit tests cover a full and a minimal payload

## 2. View

- [ ] 2.1 Draw line and bar charts as SVG with axes, gridlines, legend and locale formatting, without a chart library; verify render tests for both kinds
- [ ] 2.2 Add hover and keyboard tooltips and legend toggling; verify render tests focus a point and hide a series
- [ ] 2.3 Add the text alternative and a palette checked for contrast in both themes; verify the contrast check passes
- [ ] 2.4 Add at least 3 examples to `examples.json` and render tests in light, dark and 320 px; verify screenshots and the bundle size check pass

## 3. Docs

- [ ] 3.1 Add the component to the README component list with a screenshot and sample prompt; verify the prompt triggers `show_chart` in Claude Desktop

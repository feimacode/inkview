# Tasks

## 1. Schema and server

- [ ] 1.1 Write the `result-list` schema and tool description with a "use when" line; verify the smoke test calls `show_results` with a valid and an invalid payload
- [ ] 1.2 Write the markdown fallback; verify unit tests cover a full and a minimal payload

## 2. View

- [ ] 2.1 Render items with title, domain or source, date, 3-line snippet and favicon fallback; verify render tests with and without favicons
- [ ] 2.2 Add open and "Dig deeper" actions; verify the test host receives the open-link request and the follow-up message
- [ ] 2.3 Add at least 3 examples to `examples.json` and render tests in light, dark and 320 px; verify screenshots and the bundle size check pass

## 3. Docs

- [ ] 3.1 Add the component to the README component list with a screenshot and sample prompt; verify the prompt triggers `show_results` in Claude Desktop

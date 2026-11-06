# Tasks

## 1. Schema and server

- [x] 1.1 Write the `entity-card` schema and tool description with a "use when" line; verify the smoke test calls `show_entity_card` with a valid and an invalid payload
- [x] 1.2 Write the markdown fallback; verify unit tests cover a full and a minimal payload

## 2. View

- [x] 2.1 Render the card with logo or monogram, kind, tagline, description, facts grid and links, sharing the profile card's layout primitives; verify render tests with and without a logo
- [x] 2.2 Add "Open website" and "Compare" actions; verify the test host receives both
- [x] 2.3 Add at least 3 examples to `examples.json` and render tests in light, dark and 320 px; verify screenshots and the bundle size check pass

## 3. Docs

- [ ] 3.1 Add the component to the README component list with a screenshot and sample prompt; verify the prompt triggers `show_entity_card` in Claude Desktop

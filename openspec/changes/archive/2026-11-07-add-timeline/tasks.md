# Tasks

## 1. Schema and server

- [x] 1.1 Write the `timeline` schema (date formats, 50-event cap) and tool description with a "use when" line; verify the smoke test calls `show_timeline` with a valid and an invalid payload
- [x] 1.2 Write the markdown fallback; verify unit tests cover a full and a minimal payload, and mixed date precision
- [x] 1.3 Add a situation line to `src/guidance/index.ts` and regenerate guidance; add 5 timeline prompts to `evals/prompts.json` for when evals resume; verify `npm test` passes the guidance check

## 2. View

- [x] 2.1 Render the vertical timeline with dates at their precision, sorted, with an order toggle; verify render tests for both orders
- [x] 2.2 Add expandable detail, "Tell me more" and "Open"; verify the test host receives a message naming the event
- [x] 2.3 Add category colors, legend and filter; verify a render test hides one category
- [x] 2.4 Add at least 3 examples to `examples.json` and render tests in light, dark and 320 px; verify screenshots and the bundle size check pass

## 3. Docs

- [x] 3.1 Add the component to the README component list and gallery with a sample prompt; verify the prompt triggers `show_timeline` through a local Claude client (Claude Code with the built MCP server)

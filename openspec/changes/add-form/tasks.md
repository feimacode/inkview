# Tasks

## 1. Schema and server

- [ ] 1.1 Write the `form` schema (field types, 12-field cap, secret-field rejection) and tool description with "use when 3 or more inputs are missing"; verify the smoke test calls `show_form` with a valid payload, a select without options and a password field
- [ ] 1.2 Write the markdown fallback; verify unit tests cover a full and a minimal payload
- [ ] 1.3 Add a situation line to guidance and regenerate; add 4 form prompts and 2 "just ask" prompts to `evals/prompts.json` for when evals resume; verify `npm test` passes the guidance check

## 2. View

- [ ] 2.1 Render each field type with labels, help and defaults using native controls; verify render tests for every type and keyboard-only filling
- [ ] 2.2 Add validation with inline errors and focus on the first error; verify render tests for required, range and format errors
- [ ] 2.3 Add Submit (then read-only) and Cancel; verify the test host receives the expected messages
- [ ] 2.4 Add at least 3 examples to `examples.json` and render tests in light, dark and 320 px; verify screenshots and the bundle size check pass

## 3. Docs

- [ ] 3.1 Add the component to the README component list and gallery with a sample prompt; verify the prompt triggers `show_form` in Claude Desktop

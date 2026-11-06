# Tasks

## 1. Schema and server

- [ ] 1.1 Write the `document-preview` schema (kinds, meta, 20,000-character cap) and tool description, including "confirm before sending"; verify the smoke test calls `show_document` with a valid and an invalid payload
- [ ] 1.2 Write the markdown fallback; verify unit tests cover an email and a minimal payload
- [ ] 1.3 Add a situation line to guidance and regenerate; add 4 draft prompts to `evals/prompts.json` for when evals resume; verify `npm test` passes the guidance check

## 2. View

- [ ] 2.1 Write the markdown-to-React renderer for the supported subset; verify unit tests cover each construct and that HTML input renders as text
- [ ] 2.2 Render the header per kind and the body; verify render tests for email, post and report
- [ ] 2.3 Add Edit, Done, Approve and Copy (hidden when the clipboard fails); verify the test host receives the edited body on Approve
- [ ] 2.4 Add word and character counts with the limit marker; verify a render test over the limit
- [ ] 2.5 Add at least 3 examples to `examples.json` and render tests in light, dark and 320 px; verify screenshots and the bundle size check pass

## 3. Docs

- [ ] 3.1 Add the component to the README component list and gallery with a sample prompt; verify the prompt triggers `show_document` in Claude Desktop

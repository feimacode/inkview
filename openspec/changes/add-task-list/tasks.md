# Tasks

## 1. Schema and server

- [ ] 1.1 Write the `task-list` schema (statuses, 50-item cap) and tool description with a "use when" line; verify the smoke test calls `show_tasks` with a valid and an invalid payload
- [ ] 1.2 Write the markdown fallback; verify unit tests cover a full and a minimal payload
- [ ] 1.3 Add a situation line to guidance and regenerate; add 4 task prompts to `evals/prompts.json` for when evals resume; verify `npm test` passes the guidance check

## 2. View

- [ ] 2.1 Render the grouped checklist and the board layout with a switch; verify render tests for both at 320 px and desktop width
- [ ] 2.2 Add check-off and move-to-status by pointer and keyboard; verify a render test moves an item with the keyboard only
- [ ] 2.3 Report changes through model context and "Send changes"; verify the test host receives the context update and the message, and that only "Send changes" shows without model-context support
- [ ] 2.4 Add overdue and priority cues; verify a render test with a past due date
- [ ] 2.5 Add at least 3 examples to `examples.json` and render tests in light, dark and 320 px; verify screenshots and the bundle size check pass

## 3. Docs

- [ ] 3.1 Add the component to the README component list and gallery with a sample prompt; verify the prompt triggers `show_tasks` in Claude Desktop, and that "what's left?" after a change reflects it

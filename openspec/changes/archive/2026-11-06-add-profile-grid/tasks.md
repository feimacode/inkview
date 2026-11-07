# Tasks

## 1. Schema and server

- [x] 1.1 Extract the person schema and avatar fallback from `profile-card` so both components share them; verify existing profile card tests still pass
- [x] 1.2 Write the `profile-grid` schema (2 to 24 people) and tool description; update the profile card description to point at `show_profiles`; verify the smoke test calls `show_profiles` with a valid and an invalid payload
- [x] 1.3 Write the markdown fallback; verify unit tests cover a full and a minimal payload
- [x] 1.4 Update the guidance situation lines and regenerate guidance; add 4 "several people" prompts to `evals/prompts.json` for when evals resume; verify `npm test` passes the guidance check

## 2. View

- [x] 2.1 Render compact cards in a responsive grid with expand-in-place to the full profile card; verify render tests at 320 px and desktop width
- [x] 2.2 Add selection, "Ask about selected", "Add to shortlist" and the shortlist bar, hidden without model-context support; verify the test host receives the message and the context update
- [x] 2.3 Add at least 3 examples to `examples.json` and render tests in light, dark and 320 px; verify screenshots and the bundle size check pass

## 3. Docs

- [ ] 3.1 Add the component to the README component list and gallery with a sample prompt; verify the prompt triggers `show_profiles` in Claude Desktop

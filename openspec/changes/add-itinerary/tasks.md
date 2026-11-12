# Tasks

## 1. Schema and server

- [ ] 1.1 Write the `itinerary` schema (14-day and 12-stop caps, `HH:MM` times, coordinate pair rule) and tool description with a "use when" line; verify the smoke test calls `show_itinerary` with a full payload, a titles-only payload and 15 days
- [ ] 1.2 Write the markdown fallback with day totals per currency; verify unit tests cover a full and a minimal payload
- [ ] 1.3 Add a situation line to guidance (itinerary vs timeline vs map) and regenerate; add 4 itinerary prompts to `evals/prompts.json` for when evals resume; verify `npm test` passes the guidance check

## 2. View

- [ ] 2.1 Build the day switcher, all-days view and stop list with kind icons, travel notes and cost totals; verify render tests for a dated plan, a titles-only plan and two currencies
- [ ] 2.2 Add the per-day map with numbered pins and linked selection, reusing the map tile layer; verify render tests with tiles stubbed, tiles blocked and a day without coordinates
- [ ] 2.3 Add move earlier, move later, move to day, remove and undo with keyboard support and the "time may need updating" mark; verify render tests for each edit by keyboard
- [ ] 2.4 Report edits to model context and add "Send changes", with the fallback when model context is unavailable; verify the test host receives the full new order and the message
- [ ] 2.5 Write the .ics writer (floating local times, 1-hour default, RFC 5545 escaping and folding) and the "Add to calendar" action; verify unit tests parse the output and render tests hide the action without dates or downloads
- [ ] 2.6 Add at least 3 examples to `examples.json` (city break, family road trip, titles-only weekend) and render tests in light, dark and 320 px; verify screenshots and the bundle size check pass

## 3. Docs

- [ ] 3.1 Add the component to the README component list and gallery with a sample prompt; verify a "plan 3 days in Kyoto" prompt triggers `show_itinerary` in Claude Desktop and the .ics opens in a calendar app

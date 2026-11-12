# Tasks

## 1. Schema and server

- [x] 1.1 Make `lat` and `lng` optional as a pair, require coordinates or `address`, add `pinLabel`, and rewrite the error messages and tool description ("pass coordinates whenever you have them"); verify the smoke test covers address-only, neither, half a coordinate and a long `pinLabel`
- [x] 1.2 Update the markdown fallback for places without coordinates; verify unit tests for a mixed and an address-only payload
- [x] 1.3 Update the guidance line for maps and regenerate; add 2 prompts to `evals/prompts.json` (addresses only; places API with coordinates) for when evals resume; verify `npm test` passes the guidance check

## 2. View

- [x] 2.1 List address-only places with the "Not on map" tag and the "N of M on map" count, fitting the map to pinned places only; verify a render test with 5 of 8 pinned
- [x] 2.2 Add the list-only layout with its notice and no tile layer; verify a render test asserts no tile request is made
- [x] 2.3 Make "Open in maps" use the address when coordinates are missing; verify the test host receives the address search link
- [x] 2.4 Draw `pinLabel` pills with keyboard focus and selection states; verify render tests in light, dark and 320 px and that tile URLs still hold only tile coordinates
- [x] 2.5 Add 2 examples to `examples.json` (mixed coordinates; hotels with price labels); verify screenshots and the bundle size check pass

## 3. Docs

- [ ] 3.1 Update the README map entry, `docs/sdk.md` (breaking note: calls without coordinates now succeed) and the gallery; verify a "plumbers near Parramatta" prompt with address-only results renders in Claude Desktop

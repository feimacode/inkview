# Tasks

## 0. Spike

- [ ] 0.1 Read the current A2UI spec and samples; write `design.md` with the pinned version, the supported catalog and the mapping to Inkview primitives; verify with Iven that it is worth building

## 1. Schema and server

- [ ] 1.1 Write the `a2ui` input schema for the pinned version (size and component caps) and tool description; verify the smoke test calls `show_a2ui` with a sample surface and an invalid one
- [ ] 1.2 Write the markdown fallback; verify unit tests on 3 A2UI sample surfaces

## 2. View

- [ ] 2.1 Render the supported catalog with data binding; verify render tests for each supported component
- [ ] 2.2 Add the unsupported-component placeholder; verify a render test with an unknown component
- [ ] 2.3 Send actions with input values; verify the test host receives the message
- [ ] 2.4 Add at least 3 examples (from A2UI samples) to `examples.json` and render tests in light, dark and 320 px; verify screenshots and the bundle size check pass

## 3. Docs

- [ ] 3.1 Add the tool to the README with the pinned A2UI version; verify a sample surface renders in Claude Desktop

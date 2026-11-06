# Tasks

## 1. Workspace

- [ ] 1.1 Move the server into an npm workspace (`packages/inkview`) with `src/components` shared; verify CI, the Docker build and the cold `npx` check stay green with no behavior change

## 2. SDK

- [ ] 2.1 Add `packages/sdk` with `registerInkview`, peer dependencies on the MCP SDK and `ext-apps`, and the inlined view bundle; verify a test server lists the resource
- [ ] 2.2 Add one builder per shipped component and `inkviewToolMeta`, with configurable caps; verify unit tests for a valid result, a validation error and a raised cap per component
- [ ] 2.3 Let the view render from tool input for SDK tools that pass `component` in their metadata; verify a render test with a non-Inkview tool name
- [ ] 2.4 Generate `.d.ts` types from the schemas; verify a type test fails on a wrong field type

## 3. Example, docs and release

- [ ] 3.1 Add `examples/sdk-server/` (a tool that returns a table and a profile card from sample data); verify it renders in Claude Desktop and falls back to text in Claude Code
- [ ] 3.2 Write `docs/sdk.md` and a README section; verify every snippet compiles in CI
- [ ] 3.3 Publish the SDK in the release workflow next to the server package; verify a dry-run pack contains the types and view bundle

# Proposal

## Why

Today Inkview is a separate MCP server: the agent fetches data with one tool, then re-types it as arguments to an Inkview render tool. That second step is slow, costs tokens, caps sizes at 50 rows, and depends on the model choosing to render at all (the plan's main risk). MCP server builders who already return people, records or products could return an Inkview component straight from their own tool, with no extra call and no re-typing. The plan names an SDK for server builders as the first step after the MVP's end-user release.

## What Changes

- A TypeScript library, `@feimacode/inkview-sdk`, for MCP servers built on the official MCP SDK v2 and `ext-apps`.
- `registerInkview(server)` registers the Inkview UI resource (the same view bundle and CSP as the Inkview server) on the builder's server.
- One builder per component (`inkview.table(data)`, `inkview.profileCard(data)`, and so on) that validates data with the component's schema and returns a tool result with structured content, the markdown fallback and the UI link, ready to return from the builder's own tool.
- `inkviewToolMeta()` to add to a tool's definition so hosts know it renders.
- Typed inputs generated from the component schemas; versioned with the components.
- A sample server in `examples/sdk-server/` and a docs page.

Out of scope: Python and other languages (later, if asked), SDKs for frameworks other than the official MCP SDK (mcp-use, FastMCP, xmcp), custom components supplied by the builder, theming overrides per builder, hosting builders' servers.

## Capabilities

### New Capabilities
- `server-sdk`: A library that lets other MCP servers render Inkview components from their own tools.

### Modified Capabilities

## Impact

- Repo becomes a small npm workspace: the existing server package and the new SDK package, sharing `src/components` schemas, markdown fallbacks and the built view bundle.
- The view bundle must accept results from any tool name (today it can fall back to tool-name lookup); it already selects by `structuredContent.component`, so only early render from tool input is affected.
- A second npm package to publish on each release.

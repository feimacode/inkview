# Design

## Context

The render server already turns validated data into `{ content, structuredContent: { component, schemaVersion, data } }` and links tools to one `ui://` resource. The SDK packages exactly that for other servers. See proposal.md for why.

## Goals / Non-Goals

**Goals:**
- A builder adds a table to an existing tool in under 10 lines.
- No runtime dependencies beyond the MCP SDK and `ext-apps` the builder already has (peer dependencies).

**Non-Goals:**
- Hiding MCP from the builder; the SDK returns plain tool results.

## Decisions

**Peer-depend on `@modelcontextprotocol/server` and `ext-apps`; bundle zod schemas and the view HTML.** Builders already have the MCP SDK; duplicating it causes version clashes. The view HTML (about 100 KB gzipped) ships inside the package as a string so registration needs no file access.

**Resource URI namespaced per builder: `ui://inkview/v1/app.html` by default, overridable.** Two servers in one host may both register Inkview; hosts key resources by server, so the default is safe, and the override exists for servers that already use that path.

**Early render from tool input is off for SDK tools.** The view can only map tool input to a component for Inkview's own tool names. For builder tools it waits for the tool result. Builders can opt in by passing `component` in `inkviewToolMeta({ component })`, which the view reads from the host's tool info.

**Same schema caps as the Inkview tools by default.** The caps exist because the model re-types data; with the SDK the server passes it directly, so builders may raise list caps up to a hard limit (500 rows for tables) through an option. Larger payloads still hit the host's result size limits.

**Workspace layout.** `packages/inkview` (server, unchanged behavior) and `packages/sdk`; `src/components` stays the single source and both build from it.

## Risks / Trade-offs

- [Builders' data contains fields components don't know] → Schemas already accept unknown fields; the builders validate and strip nothing.
- [Version skew between the builder's view bundle and a host's cached resource] → The URI includes the schema major version; bumping it changes the URI.
- [Workspace move breaks CI paths and the Docker build] → Do the move as its own first task with CI green before adding the SDK.

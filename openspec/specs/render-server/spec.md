# render-server Specification

## Purpose

The Inkview MCP server exposes one render tool per UI component, each linked to an MCP Apps UI resource, and runs locally over stdio or HTTP without keeping any state.

## Requirements

### Requirement: Render tools link a UI resource
Every render tool SHALL declare a `ui://` resource in its tool metadata (`_meta.ui.resourceUri`), and the server SHALL serve that resource with the MCP Apps HTML MIME type.

#### Scenario: Host discovers the UI for a tool
- **WHEN** a client lists tools
- **THEN** each render tool carries a `ui://` resource URI
- **AND** reading that URI returns HTML with MIME type `text/html;profile=mcp-app`

### Requirement: Tool results carry structured data and a text fallback
A render tool call with valid input SHALL return `structuredContent` naming the component, its schema version and the validated data, plus a markdown text block that presents the same data.

#### Scenario: Successful render call
- **WHEN** an agent calls a render tool with valid input
- **THEN** the result holds `structuredContent` with `component`, `schemaVersion` and the data
- **AND** the first content block is markdown readable without a UI

#### Scenario: Text-only host
- **WHEN** a host that does not render MCP Apps calls the tool
- **THEN** the user sees the markdown block

### Requirement: Input validation
The server SHALL reject a render call whose input misses required fields or has wrong types, returning a tool error, and SHALL accept and ignore fields it does not know.

#### Scenario: Missing required field
- **WHEN** an agent calls a render tool without a required field
- **THEN** the call returns an error result and no UI data

#### Scenario: Unknown field
- **WHEN** an agent passes an extra field the schema does not define
- **THEN** the call succeeds

### Requirement: Stdio transport by default
Started with no arguments, the server SHALL speak MCP over stdio and SHALL write nothing but protocol messages to stdout.

#### Scenario: MCP client spawns the server
- **WHEN** Claude Desktop, Claude Code or Codex starts the server command with no arguments
- **THEN** the server answers `initialize` over stdio

### Requirement: HTTP transport on request
Started with `--http`, the server SHALL serve streamable HTTP MCP at `/mcp` on the port from `PORT` (default 3001) and a health check at `/healthz`.

#### Scenario: HTTP mode
- **WHEN** the server starts with `--http`
- **THEN** `POST /mcp` handles MCP requests and `GET /healthz` returns `{"ok": true}`

### Requirement: Stateless operation
The server SHALL keep no state between requests, SHALL store no tool data, and SHALL NOT log tool arguments or results.

#### Scenario: Error while handling a call
- **WHEN** handling a request fails
- **THEN** the log records the error message only, without the request body

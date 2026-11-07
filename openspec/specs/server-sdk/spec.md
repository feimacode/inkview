# server-sdk Specification

## Purpose

Lets other MCP servers render Inkview components directly from their own tools, without the agent calling an Inkview render tool.

## Requirements

### Requirement: Register the Inkview UI resource
`registerInkview(server, options?)` SHALL register the Inkview UI resource on an MCP server created with the official MCP SDK, with the same view bundle and CSP defaults as the Inkview server, and an optional custom resource URI and extra image domains.

#### Scenario: Builder registers Inkview
- **WHEN** a builder calls `registerInkview(server)` and a host lists the server's resources
- **THEN** the list includes the Inkview UI resource with the MCP Apps MIME type

### Requirement: Component result builders
The SDK SHALL export one function per shipped component that validates data with that component's schema and returns a tool result containing the markdown fallback as text and `structuredContent` with the component id, schema version and data.

#### Scenario: Table from a builder's tool
- **WHEN** a builder's tool returns `inkview.table({ columns, rows })` and declares `inkviewToolMeta()`
- **THEN** Claude renders the Inkview table for that tool call without any Inkview tool being called

#### Scenario: Invalid data
- **WHEN** a builder passes a table with an unknown column type
- **THEN** the builder function throws a validation error naming the field

#### Scenario: Text-only host
- **WHEN** the same tool is called from Claude Code
- **THEN** the result's text is the table's markdown fallback

### Requirement: Tool metadata helper
`inkviewToolMeta(options?)` SHALL return the `_meta` that links a tool to the Inkview UI resource, using the same URI given to `registerInkview`.

#### Scenario: Custom URI
- **WHEN** a builder registers Inkview with a custom URI and uses `inkviewToolMeta()` from the same instance
- **THEN** the tool's `_meta.ui.resourceUri` is that custom URI

### Requirement: Configurable list limits
Builder functions SHALL apply the component's default list caps, and SHALL accept an option to raise them up to a documented hard maximum per component.

#### Scenario: Large table from a server
- **WHEN** a builder passes 300 rows with the limit raised to 500
- **THEN** the result is accepted and the table renders 300 rows

### Requirement: Typed and versioned
The SDK SHALL ship TypeScript types for every builder's input, generated from the component schemas, and SHALL be versioned in step with the Inkview server.

#### Scenario: Type error at build time
- **WHEN** a builder passes a number where `name` is required as a string
- **THEN** TypeScript reports an error

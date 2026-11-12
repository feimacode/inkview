# Render Inkview components from your own MCP server

`@feimacode/inkview-sdk` lets an MCP server you already run return Inkview
components from its own tools. Hosts that support MCP Apps (Claude Desktop)
draw the component; text-only hosts (Claude Code, Codex) show the markdown
version the SDK returns alongside it. The server keeps its own tools and data;
Inkview only draws the result.

The SDK bundles the shared view and its validation schemas, so the package has
no view files to serve and no build step of its own.

## Install

```bash
npm install @feimacode/inkview-sdk @modelcontextprotocol/server @modelcontextprotocol/ext-apps
```

The MCP server and MCP Apps packages are peer dependencies: your server already
depends on the versions it runs.

## Quick start

Serve the shared view once with `registerInkview`, then attach
`view.inkviewToolMeta({ component })` to each tool that returns an Inkview
result. The tool handler returns a builder's result unchanged.

```ts
import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import { inkview, registerInkview } from "@feimacode/inkview-sdk";

const server = new McpServer({ name: "my-server", version: "1.0.0" });
const view = registerInkview(server);

registerAppTool(
  server,
  "city_temperatures",
  {
    title: "City temperatures",
    description: "July averages rendered as a table.",
    _meta: view.inkviewToolMeta({ component: "data_table" }),
  },
  async () =>
    inkview.table({
      title: "July averages",
      columns: [
        { key: "city", label: "City" },
        { key: "celsius", label: "Celsius", type: "number" },
      ],
      rows: [
        { city: "Oslo", celsius: 17 },
        { city: "Lisbon", celsius: 25 },
      ],
    }),
);

await server.connect(new StdioServerTransport());
```

`registerInkview` registers one `ui://inkview/v1/app.html` resource and returns
the `view` instance. Call it once per server. Tools without Inkview metadata
behave like any other MCP tool.

Naming the `component` in the metadata lets the view start drawing as soon as
the tool call's arguments arrive, before the result is ready. A tool that cannot
draw from its input can omit it and render only once the result is returned.

## Builders

Every builder is available as a named export (`showTable`) and on the
`inkview` object (`inkview.table`). Both forms take the component's data and an
optional `{ limit }`, and return the MCP `CallToolResult` your tool handler
should return.

| Builder | Component | `limit` caps | Default | Maximum |
| --- | --- | --- | --- | --- |
| `inkview.profileCard` | `profile_card` | highlights | 6 | 50 |
| `inkview.profiles` | `profile_grid` | people | 24 | 200 |
| `inkview.table` | `data_table` | rows | 50 | 500 |
| `inkview.results` | `result_list` | results | 20 | 200 |
| `inkview.entityCard` | `entity_card` | facts | 8 | 50 |
| `inkview.comparison` | `comparison` | items | 5 | 20 |
| `inkview.chart` | `chart` | x values | 100 | 1000 |
| `inkview.products` | `product_grid` | products | 12 | 100 |
| `inkview.timeline` | `timeline` | events | 50 | 500 |
| `inkview.tasks` | `task_list` | items | 50 | 500 |
| `inkview.document` | `document_preview` | body characters | 20000 | 100000 |
| `inkview.form` | `form` | fields | 12 | 50 |
| `inkview.map` | `map` | places | 50 | 500 |
| `inkview.listings` | `listings` | listings | 20 | 100 |
| `inkview.itinerary` | `itinerary` | days | 14 | 60 |

The input type of each builder is exported too (`DataTableInput`,
`ProfileCardInput`, ...), and `ComponentId` is the union of component ids.

`inkview.map` accepts a place with an `address` and no `lat` and `lng` since
this release: it is listed without a pin, where it used to be rejected. A place
with neither still throws. `inkview.table` takes `journey` columns and
`inkview.comparison` takes `{ type: "journey" }` values for flights, trains and
buses.

## Raising a cap

`limit` raises a builder's primary list cap up to its maximum. Values outside
`1..maximum` throw a `RangeError`.

```ts
const rows = Array.from({ length: 300 }, (_, i) => ({ city: `City ${i}`, celsius: 10 + (i % 30) }));

const result = inkview.table(
  {
    columns: [
      { key: "city", label: "City" },
      { key: "celsius", label: "Celsius", type: "number" },
    ],
    rows,
  },
  { limit: 500 },
);
```

Without `limit`, the default cap applies and data above it is rejected, so raise
the cap deliberately when a tool really returns more.

## Validation

Builders parse their input with the same schema the server uses. Invalid data
throws a `ZodError`, which the MCP SDK reports as a tool error. The types catch
most of it before runtime:

```ts
// @ts-expect-error a person's name must be a string
inkview.profileCard({ name: 42 });
```

Fields the component does not know are kept, not dropped, so a component can
carry data for a later call.

## Links, actions and sources

The pieces the components share are exported for servers that build their own
schemas or text around a component:

```ts
import { z } from "zod";
import { SourceSchema, deriveActions, httpUrl, mdActions, mdProvenance } from "@feimacode/inkview-sdk";

// A URL field that rejects javascript: and data: links.
const Venue = z.object({ name: z.string(), website: httpUrl.optional(), source: SourceSchema.optional() });
Venue.parse({ name: "The Basement", website: "https://example.com", source: { name: "Example", retrievedAt: "2026-11-12T09:30:00+11:00" } });

// Which buttons a card gets from the fields it has, and the same as markdown links.
const item = { title: "The Basement", phone: "(02) 9555 0142", address: "7 Macquarie Pl, Sydney" };
deriveActions(item, { canDownload: false }).map((a) => a.label); // ["Call", "Directions"]
mdActions(item); // "[(02) 9555 0142](tel:0295550142) · [Directions](https://…)"

// The source line of a text fallback.
mdProvenance({ source: { name: "Example", retrievedAt: "2026-11-12T09:30:00+11:00" }, sensitive: true });
```

Also exported: `phone`, `UnverifiedSchema`, `canOpen`, `collectSources`,
`latestCheck` and `isStale`. The action buttons themselves are drawn by the
shared view; there is no component to import. See
[Actions and sources](../README.md#actions-and-sources) for the fields each
component takes.

## Text fallback

Each result contains both forms:

- `content` with the markdown version, for text-only hosts and the model
- `structuredContent` with the component id and data, for the view

Returning the builder's result as-is gives both. There is nothing to render for
hosts without MCP Apps support.

## Custom resource URI and image hosts

The default resource URI is `ui://inkview/v1/app.html`. Pass `uri` to register a
different one, and `imageDomains` to extend the image hosts the component CSP
allows (the built-in list and `INKVIEW_IMAGE_DOMAINS` still apply). Tools using
the instance helper point at the same URI automatically.

```ts
const server = new McpServer({ name: "my-server", version: "1.0.0" });
const view = registerInkview(server, {
  uri: "ui://my-company/inkview.html",
  imageDomains: ["images.example.com"],
});
const tableTool = view.inkviewToolMeta({ component: "data_table" });
```

Without the instance helper, `inkviewToolMeta({ component, uri })` builds the
same metadata.

## Example

[`examples/sdk-server`](../examples/sdk-server) is a complete stdio server with
a data table tool and a profile card tool:

```bash
npm install
npm run build
npm start --workspace @feimacode/inkview-sdk-example
```

#!/usr/bin/env node
/**
 * Sample MCP server for @feimacode/inkview-sdk. It serves two tools, each
 * returning an Inkview component built by the SDK from sample data.
 *
 *   npm install
 *   npm run build
 *   npm start --workspace @feimacode/inkview-sdk-example
 */
import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { inkview, registerInkview } from "@feimacode/inkview-sdk";

const server = new McpServer({ name: "inkview-sdk-example", version: "0.1.0" });
const view = registerInkview(server);

registerAppTool(
  server,
  "city_temperatures",
  {
    title: "City temperatures",
    description: "Sample July temperatures rendered as an Inkview table.",
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
        { city: "Nairobi", celsius: 21 },
      ],
    }),
);

registerAppTool(
  server,
  "team_member",
  {
    title: "Team member",
    description: "Sample person rendered as an Inkview profile card.",
    _meta: view.inkviewToolMeta({ component: "profile_card" }),
  },
  async () =>
    inkview.profileCard({
      name: "Ada Lovelace",
      headline: "Mathematician",
      company: "Analytical Engines",
      highlights: ["Wrote the first algorithm intended for a machine"],
    }),
);

await server.connect(new StdioServerTransport());

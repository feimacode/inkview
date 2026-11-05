// Spawns the server the way an MCP client does (stdio) and calls the tool.
// Usage: node scripts/stdio-test.mjs [command] [...args]   (default: node dist/main.js)
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import assert from "node:assert/strict";

const [command = process.execPath, ...args] = process.argv.slice(2);
const client = new Client({ name: "stdio-test", version: "0" });
await client.connect(new StdioClientTransport({ command, args: args.length ? args : ["dist/main.js"] }));
const { tools } = await client.listTools();
assert.ok(tools.some((t) => t.name === "show_profile_card"));
const res = await client.callTool({ name: "show_profile_card", arguments: { name: "Ada Lovelace" } });
assert.equal(res.structuredContent.profile.name, "Ada Lovelace");
const rr = await client.readResource({ uri: tools[0]._meta.ui.resourceUri });
assert.ok(rr.contents[0].text.length > 1000);
console.log(`✓ stdio: tools/list, tools/call, resources/read (${command} ${args.join(" ")})`);
await client.close();

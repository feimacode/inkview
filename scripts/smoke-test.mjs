// End-to-end smoke test: start the HTTP server, then act as an MCP client.
import { spawn } from "node:child_process";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import assert from "node:assert/strict";

const PORT = process.env.PORT ?? "3999";
const srv = spawn(process.execPath, ["dist/main.js", "--http"], { env: { ...process.env, PORT }, stdio: ["ignore", "pipe", "inherit"] });
await new Promise((resolve) => srv.stdout.on("data", (d) => String(d).includes("listening") && resolve()));

try {
  const client = new Client({ name: "smoke", version: "0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(`http://localhost:${PORT}/mcp`)));

  const { tools } = await client.listTools();
  const tool = tools.find((t) => t.name === "show_profile_card");
  assert.ok(tool, "show_profile_card is listed");
  const uri = tool._meta?.ui?.resourceUri;
  assert.match(uri, /^ui:\/\//, "tool links a ui:// resource");
  console.log("✓ tools/list:", tool.name, "→", uri);

  const res = await client.callTool({
    name: "show_profile_card",
    arguments: {
      name: "Ada Lovelace",
      headline: "Mathematician, first computer programmer",
      location: "London, UK",
      tags: ["Analytical Engine", "Mathematics"],
      profileUrl: "https://en.wikipedia.org/wiki/Ada_Lovelace",
      somethingUnknown: "is accepted",
    },
  });
  assert.equal(res.isError ?? false, false);
  assert.equal(res.structuredContent.profile.name, "Ada Lovelace");
  assert.match(res.content[0].text, /### Ada Lovelace/);
  console.log("✓ tools/call: structuredContent + markdown fallback");

  const bad = await client.callTool({ name: "show_profile_card", arguments: { headline: "no name" } });
  assert.equal(bad.isError, true, "missing name is rejected");
  console.log("✓ tools/call rejects invalid input");

  const rr = await client.readResource({ uri });
  const item = rr.contents[0];
  assert.equal(item.mimeType, "text/html;profile=mcp-app");
  assert.ok(item.text.includes("<div id=\"root\">"));
  assert.ok(item._meta?.ui?.csp?.resourceDomains?.length > 0);
  console.log(`✓ resources/read: ${(item.text.length / 1024).toFixed(0)} KB HTML, CSP declared`);
  await client.close();
  console.log("All smoke tests passed.");
} finally {
  srv.kill();
}

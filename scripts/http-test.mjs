// Hosted-mode checks: body limit (413), rate limit (429), metadata-only logs,
// and resource metadata driven by environment config.
import { spawn } from "node:child_process";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import assert from "node:assert/strict";

const PORT = "3998";
const URL_ = `http://localhost:${PORT}/mcp`;
const SENTINEL = "SENTINEL-7f3a9c";
const srv = spawn(process.execPath, ["dist/inkview.js", "--http"], {
  env: {
    ...process.env,
    PORT,
    INKVIEW_RATE_LIMIT: "15",
    INKVIEW_UI_DOMAIN: "inkview-sandbox.example.com",
    INKVIEW_IMAGE_DOMAINS: "https://img.example.com",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let logs = "";
srv.stdout.on("data", (d) => (logs += d));
srv.stderr.on("data", (d) => (logs += d));
await new Promise((resolve) => srv.stdout.on("data", (d) => String(d).includes("listening") && resolve()));

const post = (body, headers = {}) =>
  fetch(URL_, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

try {
  // 1. Config reaches the resource metadata.
  const client = new Client({ name: "http-test", version: "0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(URL_)));
  const { contents } = await client.readResource({ uri: "ui://inkview/v1/app.html" });
  const ui = contents[0]._meta.ui;
  assert.equal(ui.domain, "inkview-sandbox.example.com");
  assert.ok(ui.csp.resourceDomains.includes("https://img.example.com"));
  console.log("✓ ui.domain and CSP image domains come from the environment");

  // 2. Tool data never reaches the logs, on success or on a validation error.
  await client.callTool({ name: "show_profile_card", arguments: { name: SENTINEL, headline: SENTINEL, profileUrl: `https://example.com/${SENTINEL}` } });
  await client.callTool({ name: "show_profile_card", arguments: { headline: SENTINEL } });
  await client.close();
  const bad = await post(`{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"${SENTINEL}"`);
  assert.equal(bad.status, 400);
  await new Promise((r) => setTimeout(r, 100));
  assert.ok(!logs.includes(SENTINEL), "sentinel value appears in logs");
  assert.match(logs, /"rpc":"tools\/call","tool":"show_profile_card"/);
  console.log("✓ logs hold method, tool, status and timing only (sentinel absent)");

  // 3. Oversized bodies are refused before processing.
  const big = await post({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "show_table", arguments: { pad: "x".repeat(1024 * 1024) } } });
  assert.equal(big.status, 413);
  console.log("✓ 1 MB body → 413");

  // 4. A burst from one IP is rate limited.
  const statuses = [];
  for (let i = 0; i < 20; i++) statuses.push((await post({ jsonrpc: "2.0", id: i, method: "ping" })).status);
  const limited = await post({ jsonrpc: "2.0", id: 99, method: "ping" });
  assert.equal(limited.status, 429);
  assert.ok(Number(limited.headers.get("retry-after")) > 0, "Retry-After is set");
  assert.ok(statuses.includes(200) || statuses.includes(202), "requests under the limit succeed");
  console.log(`✓ burst → 429 after the limit (Retry-After ${limited.headers.get("retry-after")}s)`);

  const health = await fetch(`http://localhost:${PORT}/healthz`).then((r) => r.json());
  assert.equal(health.ok, true);
  console.log("All HTTP hardening checks passed.");
} finally {
  srv.kill();
}

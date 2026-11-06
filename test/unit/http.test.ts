import { test } from "node:test";
import assert from "node:assert/strict";
import { describeRpc, httpConfig, RateLimiter } from "../../src/http/limits.js";

test("rate limiter: fixed window per key", () => {
  let now = 0;
  const rl = new RateLimiter(2, 60_000, () => now);
  assert.equal(rl.take("a"), 0);
  assert.equal(rl.take("a"), 0);
  assert.equal(rl.take("a"), 60);
  assert.equal(rl.take("b"), 0, "other IPs are unaffected");
  now = 30_000;
  assert.equal(rl.take("a"), 30);
  now = 60_000;
  assert.equal(rl.take("a"), 0, "window resets");
  assert.equal(new RateLimiter(0, 1000).take("a"), 0, "0 turns it off");
});

test("describeRpc keeps method and tool name only", () => {
  assert.deepEqual(describeRpc({ method: "tools/call", params: { name: "show_table", arguments: { secret: 1 } } }), { rpc: "tools/call", tool: "show_table" });
  assert.deepEqual(describeRpc({ method: "tools/list" }), { rpc: "tools/list", tool: undefined });
  assert.equal(describeRpc({ method: "tools/call", params: { name: "has spaces and a value" } }).tool, undefined);
  assert.deepEqual(describeRpc("x"), {});
});

test("http config defaults and overrides", () => {
  const d = httpConfig({});
  assert.equal(d.bodyLimit, "256kb");
  assert.equal(d.rateLimit, 120);
  assert.equal(d.trustProxy, false);
  const o = httpConfig({ INKVIEW_RATE_LIMIT: "0", INKVIEW_TRUST_PROXY: "1", INKVIEW_LOG: "off", INKVIEW_ALLOWED_HOSTS: "a.io, b.io" });
  assert.equal(o.rateLimit, 0);
  assert.equal(o.trustProxy, true);
  assert.equal(o.log, false);
  assert.deepEqual(o.allowedHosts, ["a.io", "b.io"]);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { resourceMeta } from "../../packages/inkview/src/resource.js";
import { mapConfig, tileDomains, tileTemplate } from "../../src/components/map/config.js";

test("map tiles come from the environment, off disables them", () => {
  assert.equal(tileTemplate({}), "https://tile.openstreetmap.org/{z}/{x}/{y}.png");
  assert.equal(tileTemplate({ INKVIEW_MAP_TILES: "off" }), null);
  assert.equal(tileTemplate({ INKVIEW_MAP_TILES: "OFF" }), null);
  assert.equal(tileTemplate({ INKVIEW_MAP_TILES: "https://tiles.example.com/{z}/{x}/{y}.png" }), "https://tiles.example.com/{z}/{x}/{y}.png");
});

test("map config carries the template and attribution", () => {
  assert.deepEqual(mapConfig({}), {
    tileTemplate: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap contributors",
  });
  assert.deepEqual(mapConfig({ INKVIEW_MAP_TILES: "off", INKVIEW_MAP_ATTRIBUTION: "Map data © Example" }), {
    tileTemplate: null,
    attribution: "Map data © Example",
  });
});

test("the tile host is derived from the template, subdomains included", () => {
  assert.deepEqual(tileDomains({}), ["https://tile.openstreetmap.org"]);
  assert.deepEqual(tileDomains({ INKVIEW_MAP_TILES: "https://{s}.tiles.example.com/{z}/{x}/{y}.png" }), ["https://*.tiles.example.com"]);
  assert.deepEqual(tileDomains({ INKVIEW_MAP_TILES: "off" }), []);
  assert.deepEqual(tileDomains({ INKVIEW_MAP_TILES: "not a url" }), []);
});

test("resource metadata declares the tile host with tiles on and not with tiles off", () => {
  const on = resourceMeta({}).ui.csp.resourceDomains;
  assert.ok(on.includes("https://tile.openstreetmap.org"), "tile host is in the CSP");
  assert.ok(on.includes("https://avatars.githubusercontent.com"), "image hosts are still there");

  const off = resourceMeta({ INKVIEW_MAP_TILES: "off" }).ui.csp.resourceDomains;
  assert.ok(!off.some((d) => d.includes("tile")), "no tile host when tiles are off");
  assert.ok(off.includes("https://avatars.githubusercontent.com"), "image hosts are still there");

  const custom = resourceMeta({ INKVIEW_MAP_TILES: "https://tiles.example.com/{z}/{x}/{y}.png" }).ui.csp.resourceDomains;
  assert.ok(custom.includes("https://tiles.example.com"));
  assert.ok(!custom.includes("https://tile.openstreetmap.org"));
});

test("resource metadata keeps the UI domain when set", () => {
  assert.equal(resourceMeta({}).ui.domain, undefined);
  assert.equal(resourceMeta({ INKVIEW_UI_DOMAIN: "ui.example.com" }).ui.domain, "ui.example.com");
});

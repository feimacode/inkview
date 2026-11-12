import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SourceSchema, UnverifiedSchema } from "../../src/components/provenance.js";
import { serverComponents } from "../../src/components/server-registry.js";
import { ago, anyUnverified, collectSources, DAY, isStale, isUnverified, latestCheck, mdChecked, mdProvenance } from "../../src/runtime/provenance.js";

const get = (id: string) => serverComponents.find((c) => c.meta.component === id)!;
const NOW = Date.parse("2026-11-12T12:00:00Z");

test("source: name and url alone stay valid; retrievedAt must be an ISO 8601 date-time", () => {
  assert.equal(SourceSchema.safeParse({ name: "Booking.com", url: "https://booking.com" }).success, true);
  assert.equal(SourceSchema.safeParse({ name: "Booking.com" }).success, true);
  for (const ok of ["2026-11-12T09:30:00+11:00", "2026-11-12T09:30:00Z", "2026-11-12T09:30", "2026-11-12"]) {
    assert.equal(SourceSchema.safeParse({ name: "s", retrievedAt: ok }).success, true, ok);
  }
  for (const bad of ["yesterday", "12/11/2026", "2026-13-45T00:00:00Z", "1762900000", ""]) {
    const r = SourceSchema.safeParse({ name: "s", retrievedAt: bad });
    assert.equal(r.success, false, bad);
    assert.deepEqual(r.error!.issues[0].path, ["retrievedAt"]);
  }
});

test("a bad retrievedAt in a component call is rejected, naming the field", () => {
  const r = get("listings").schema.safeParse({ listings: [{ title: "x" }], source: { name: "s", retrievedAt: "last week" } });
  assert.equal(r.success, false);
  assert.deepEqual(r.error!.issues[0].path, ["source", "retrievedAt"]);
});

test("unverified: unknown field names are accepted and ignored", () => {
  assert.equal(UnverifiedSchema.safeParse(["price", "no_such_field"]).success, true);
  const c = get("listings");
  const data = c.schema.parse({ listings: [{ title: "Tap Shop", unverified: ["warranty"] }] });
  assert.equal(c.toMarkdown(data), "1. **Tap Shop**\n\n_No source given_");
  assert.equal(isUnverified({ unverified: ["price"] }, "price"), true);
  assert.equal(isUnverified({ unverified: ["price"] }, "phone"), false);
  assert.equal(isUnverified(undefined, "price"), false);
  assert.equal(anyUnverified([{}, { unverified: [] }]), false);
  assert.equal(anyUnverified([{}, { unverified: ["price"] }]), true);
});

test("every item type takes its own source and unverified list", () => {
  const source = { name: "Site", url: "https://site.example", retrievedAt: "2026-11-12T09:30:00Z" };
  const p = { source, unverified: ["price"] };
  assert.equal(get("listings").schema.safeParse({ listings: [{ title: "x", ...p }] }).success, true);
  assert.equal(get("product_grid").schema.safeParse({ products: [{ title: "x", url: "https://s.io", ...p }] }).success, true);
  assert.equal(get("comparison").schema.safeParse({ items: [{ name: "A", ...p }, { name: "B" }], criteria: ["price"], values: [["1"], ["2"]] }).success, true);
  assert.equal(get("itinerary").schema.safeParse({ days: [{ stops: [{ title: "x", ...p }] }] }).success, true);
  assert.equal(get("map").schema.safeParse({ places: [{ label: "x", address: "1 Dock Rd", ...p }] }).success, true);
  assert.equal(get("entity_card").schema.safeParse({ name: "x", source, unverified: ["phone"] }).success, true);
  const results = get("result_list").schema;
  assert.equal(results.safeParse({ results: [{ title: "x", url: "https://a.io", source: "a.io", sourceInfo: source, unverified: ["snippet"] }] }).success, true);
  assert.equal(results.safeParse({ results: [{ title: "x", url: "https://a.io", source: "a.io" }] }).success, true, "the string source still validates");
});

test("collectSources lists each distinct source once, in first-seen order", () => {
  const a = { name: "Booking.com", url: "https://booking.com" };
  const b = { name: "Airbnb", url: "https://airbnb.com" };
  assert.deepEqual(collectSources(undefined, [{ source: a }, { source: b }, { source: a }, {}, { source: b }, { source: a }]), [a, b]);
  assert.deepEqual(collectSources(b, [{ source: a }, { source: "plain text" }]), [b, a]);
  assert.deepEqual(collectSources(undefined, [{ source: "a.io", sourceInfo: a }]), [a], "result items use sourceInfo");
  assert.deepEqual(collectSources(undefined), []);
});

test("latestCheck takes the newest of retrievedAt and asOf; staleness starts after 24 hours", () => {
  const sources = [{ name: "a", retrievedAt: "2026-11-11T10:00:00Z" }, { name: "b", retrievedAt: "2026-11-12T08:00:00Z" }, { name: "c" }];
  assert.equal(latestCheck(sources), Date.parse("2026-11-12T08:00:00Z"));
  assert.equal(latestCheck(sources, "2026-11-12T11:00:00Z"), Date.parse("2026-11-12T11:00:00Z"));
  assert.equal(latestCheck([{ name: "c" }]), undefined);
  assert.equal(isStale(NOW - DAY, NOW), false, "exactly 24 hours is not stale");
  assert.equal(isStale(NOW - DAY - 1, NOW), true);
  assert.equal(isStale(NOW - 2 * 3_600_000, NOW), false);
  assert.equal(isStale(undefined, NOW), false, "no check time, no stale note");
});

test("ago reads as hours and days", () => {
  assert.equal(ago(NOW - 2 * 3_600_000, "en", NOW), "2 hours ago");
  assert.equal(ago(NOW - 30 * 3_600_000, "en", NOW), "1 day ago");
  assert.equal(ago(NOW - 5 * 60_000, "en", NOW), "5 minutes ago");
  assert.equal(ago(NOW + 60_000, "en", NOW), "0 minutes ago", "a clock that runs ahead never shows the future");
});

test("mdProvenance: source line, check time, stale note and missing source", () => {
  const src = { name: "Booking.com", url: "https://booking.com", retrievedAt: "2026-11-12T10:00:00Z" };
  assert.equal(mdProvenance({ source: src, sensitive: true }, NOW), "_Source: [Booking.com](https://booking.com) · checked 2026-11-12 10:00 UTC_");
  assert.equal(mdProvenance({ source: { ...src, retrievedAt: "2026-11-11T06:00:00Z" }, sensitive: true }, NOW), "_Source: [Booking.com](https://booking.com) · checked 2026-11-11 06:00 UTC · may have changed_");
  assert.equal(mdProvenance({ source: { ...src, retrievedAt: "2026-11-11T06:00:00Z" } }, NOW), "_Source: [Booking.com](https://booking.com) · checked 2026-11-11 06:00 UTC_", "no stale note where nothing is price-like");
  assert.equal(mdProvenance({ source: { name: "Guide" } }, NOW), "_Source: Guide_");
  assert.equal(mdProvenance({ sensitive: true }, NOW), "_No source given_");
  assert.equal(mdProvenance({}, NOW), "");
  assert.equal(mdProvenance({ items: [{ source: { name: "A" } }, { source: { name: "B" } }, { source: { name: "A" } }], sensitive: true }, NOW), "_Source: A, B_");
  assert.equal(mdChecked({ unverified: ["price"] }, "price", "A$95"), "A$95 (not checked)");
  assert.equal(mdChecked({ unverified: ["price"] }, "rating", "★ 4.8"), "★ 4.8");
  assert.equal(mdChecked({ unverified: ["price"] }, "price", ""), "");
});

test("markdown fallbacks mark unverified values and name every source", () => {
  const listings = get("listings");
  const md = listings.toMarkdown(
    listings.schema.parse({
      kind: "stay",
      listings: [
        { title: "Harbour Inn", price: { amount: 210, currency: "AUD" }, phone: "(02) 9555 0142", unverified: ["price", "phone"], source: { name: "Booking.com", url: "https://booking.com" } },
        { title: "Loft", rating: 4.7, source: { name: "Airbnb", url: "https://airbnb.com" } },
      ],
    }),
  );
  assert.match(md, /A\$210 per night \(not checked\)/);
  assert.match(md, /\[\(02\) 9555 0142\]\(tel:0295550142\) \(not checked\)/);
  assert.doesNotMatch(md, /4\.7 \(not checked\)/);
  assert.match(md, /_Source: \[Booking\.com\]\(https:\/\/booking\.com\), \[Airbnb\]\(https:\/\/airbnb\.com\)_$/);

  const products = get("product_grid");
  assert.match(products.toMarkdown(products.schema.parse({ products: [{ title: "Tee", url: "https://s.io/tee", price: 9.5, currency: "USD", unverified: ["price"] }] })), /\$9\.50 \(not checked\)/);
  const cmp = get("comparison");
  assert.match(cmp.toMarkdown(cmp.schema.parse({ items: [{ name: "A", unverified: ["Price"] }, { name: "B" }], criteria: ["Price"], values: [["$1"], ["$2"]] })), /\$1 \(not checked\)/);
  const chart = get("chart");
  assert.match(chart.toMarkdown(chart.schema.parse({ kind: "bar", x: ["a"], series: [{ name: "s", values: [1] }], source: { name: "ABS", retrievedAt: "2026-11-12T10:00:00Z" } })), /_Source: ABS · checked 2026-11-12 10:00 UTC_$/);
});

test("the README's provenance example is a valid listings call", () => {
  const block = readFileSync("README.md", "utf8").match(/<!-- example: provenance -->\n```json\n([\s\S]*?)```/);
  assert.ok(block, "the README keeps its provenance example");
  const c = get("listings");
  const md = c.toMarkdown(c.schema.parse(JSON.parse(block[1])));
  assert.match(md, /A\$240 per night \(not checked\)/);
  assert.match(md, /\[\(02\) 9555 0142\]\(tel:0295550142\)/);
  assert.match(md, /\[Directions\]\(https:\/\/www\.openstreetmap\.org/);
  assert.match(md, /_Source: \[Booking\.com\]\(https:\/\/www\.booking\.com\), \[Airbnb\]\(https:\/\/www\.airbnb\.com\) · checked 2026-11-11 22:32 UTC/);
});

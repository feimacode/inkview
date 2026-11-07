import { test } from "node:test";
import assert from "node:assert/strict";
import { detect } from "../../packages/inkview/src/auto/detect.js";
import { runAuto } from "../../packages/inkview/src/auto/tool.js";

const comp = (data: unknown, hint?: string) => runAuto({ data, hint }).component;

test("products: arrays with title, url and price", () => {
  assert.equal(comp([{ title: "A", url: "https://s.io/a", price: 10 }, { title: "B", url: "https://s.io/b", price: "$12.99" }]), "product_grid");
  assert.equal(comp({ products: [{ name: "Mug", link: "https://s.io/m", price: 8, image: "https://s.io/m.jpg" }] }), "product_grid");
  const d = detect([{ name: "Lamp", productUrl: "https://s.io/l", salePrice: "€39,00", rating: 4.2, reviews: 12 }])!;
  assert.equal(d.component, "product_grid");
  assert.equal((d.data.products as any[])[0].currency, "EUR");
});

test("results: arrays with title and url", () => {
  assert.equal(comp([{ title: "A", url: "https://a.io", snippet: "x" }, { title: "B", url: "https://b.io" }]), "result_list");
  assert.equal(comp({ query: "mcp", results: [{ name: "Spec", link: "https://spec.io", description: "d" }] }), "result_list");
  assert.equal(comp([{ title: "News", href: "https://n.io", publishedAt: "2026-01-02", source: "N" }]), "result_list");
});

test("chart: series over dates or label → number maps", () => {
  assert.equal(comp([{ month: "2026-01", users: 10 }, { month: "2026-02", users: 12 }, { month: "2026-03", users: 15 }]), "chart");
  assert.equal(comp({ Mon: 3, Tue: 5, Wed: 2, Thu: 7 }), "chart");
  assert.equal(comp({ kind: "bar", x: ["a", "b"], series: [{ name: "s", values: [1, 2] }] }), "chart");
  assert.equal(comp([{ quarter: "Q1 2026", revenue: 1, cost: 2 }, { quarter: "Q2 2026", revenue: 3, cost: 2 }, { quarter: "Q3 2026", revenue: 4, cost: null }]), "chart");
});

test("profile: a person with a role or person-like fields", () => {
  assert.equal(comp({ name: "Ada Lovelace", jobTitle: "Mathematician" }), "profile_card");
  assert.equal(comp({ firstName: "Grace", lastName: "Hopper", linkedin: "https://linkedin.com/in/x" }), "profile_card");
  assert.equal(comp([{ name: "Linus", role: "Maintainer", github: "https://github.com/torvalds", skills: ["C", "Git"] }]), "profile_card");
});

test("entity: an organization or place", () => {
  assert.equal(comp({ name: "Stripe", industry: "Payments", founded: 2010, website: "https://stripe.com" }), "entity_card");
  assert.equal(comp({ name: "Tempelhofer Feld", type: "park", address: "Berlin" }), "entity_card");
  assert.equal(comp({ name: "MIT", kind: "university", headquarters: "Cambridge, MA" }), "entity_card");
});

test("map: places with coordinates", () => {
  assert.equal(comp([{ name: "Reyes", lat: 55.6778, lng: 12.5785 }, { name: "Prolog", lat: 55.6863, lng: 12.5579 }]), "map");
  assert.equal(comp({ name: "Feimacom", address: "Sveavagen 1, Stockholm", lat: 59.3346, lng: 18.0633 }), "map");
  assert.equal(comp([{ label: "A", latitude: 52.5, longitude: 13.4 }, { label: "B", latitude: 52.6, longitude: 13.5 }]), "map");
});

test("timeline: dated events", () => {
  assert.equal(comp([{ date: "2019", event: "Founded" }, { date: "2020-06-15", title: "First release" }]), "timeline");
  assert.equal(comp([{ year: 2016, event: "BSc" }, { year: 2021, event: "Lead engineer" }]), "timeline");
  assert.equal(comp({ name: "Maya Chen", history: [{ year: 2016, event: "BSc" }, { date: "2018-07", event: "Engineer" }] }), "timeline");
});

test("tasks: items with a status or done flag", () => {
  assert.equal(comp([{ title: "Write docs", status: "To do" }, { title: "Ship", status: "Done" }]), "task_list");
  assert.equal(comp([{ title: "Review budget", done: true }, { title: "Book flights", done: false }]), "task_list");
  assert.equal(comp({ title: "Sprint 42", items: [{ title: "Search filters", status: "Review" }, { title: "Bulk import", status: "Doing" }] }), "task_list");
});

test("profile grid: several people with roles", () => {
  assert.equal(comp([{ name: "Mira Hoffmann", headline: "Staff Rust Engineer" }, { name: "Daniel Okafor", headline: "Head of ML" }]), "profile_grid");
  assert.equal(comp({ people: [{ name: "Ada", jobTitle: "Mathematician" }, { name: "Grace", jobTitle: "Admiral" }] }), "profile_grid");
});

test("hint names the new components", () => {
  const events = [{ date: "2026-01", title: "Discovery" }, { date: "2026-03", title: "Beta" }];
  assert.equal(comp(events), "timeline");
  assert.equal(comp(events, "timeline"), "timeline");
  assert.equal(comp([{ name: "A", lat: 1, lng: 2 }, { name: "B", lat: 3, lng: 4 }], "map"), "map");
  assert.equal(comp([{ title: "A", status: "To do" }, { title: "B", status: "Done" }], "tasks"), "task_list");
  assert.equal(comp([{ name: "A", headline: "x" }, { name: "B", headline: "y" }], "profiles"), "profile_grid");
});

test("table: same-shaped records", () => {
  assert.equal(comp([{ city: "Tokyo", pop: 37 }, { city: "Delhi", pop: 31 }]), "data_table");
  assert.equal(comp({ rows: [{ a: 1, b: "x" }, { a: 2, b: "y" }, { a: 3 }] }), "data_table");
  const many = runAuto({ data: Array.from({ length: 80 }, (_, i) => ({ id: i, name: `n${i}` })) });
  assert.equal(many.component, "data_table");
  assert.equal((many.data!.rows as unknown[]).length, 50);
  assert.match(many.text, /first 50 of 80 rows/);
});

test("no match: formatted text", () => {
  const r = runAuto({ data: "just a sentence" });
  assert.equal(r.component, null);
  assert.match(r.text, /No specific component matched/);
  assert.equal(comp({ a: { b: { c: 1 } } }), null);
});

test("hint overrides detection when the data maps", () => {
  const products = [{ title: "A", url: "https://s.io/a", price: 10 }, { title: "B", url: "https://s.io/b", price: 12 }];
  assert.equal(comp(products), "product_grid");
  assert.equal(comp(products, "table"), "data_table");
  assert.equal(comp({ Mon: 3, Tue: 5, Wed: 2 }, "table"), "chart", "hint ignored when data can't map");
});

test("result names the explicit tool", () => {
  assert.match(runAuto({ data: [{ title: "A", url: "https://s.io/a", price: 1 }] }).text, /^Shown with show_products/);
});

test("rejects data over 100 KB", () => {
  assert.throws(() => runAuto({ data: "x".repeat(110 * 1024) }), /at most 100 KB/);
});

test("map via show_auto carries the tile config, like show_map", () => {
  const r = runAuto({ data: [{ name: "Reyes", lat: 55.6778, lng: 12.5785 }, { name: "Prolog", lat: 55.6863, lng: 12.5579 }] });
  assert.equal(r.component, "map");
  assert.ok(r.config && typeof r.config === "object" && "tileTemplate" in r.config);
  assert.equal(runAuto({ data: [{ id: 1, name: "a" }, { id: 2, name: "b" }, { id: 3, name: "c" }] }).config, undefined);
});

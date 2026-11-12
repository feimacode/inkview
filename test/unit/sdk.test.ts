import { test } from "node:test";
import assert from "node:assert/strict";
import { RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import {
  DEFAULT_APP_URI,
  inkviewToolMeta,
  registerInkview,
  showChart,
  showComparison,
  showDocument,
  showEntityCard,
  showForm,
  showItinerary,
  showListings,
  showMap,
  showProducts,
  showProfileCard,
  showProfiles,
  showResults,
  showTable,
  showTasks,
  showTimeline,
} from "../../packages/sdk/src/index.js";

const textOf = (r: { content?: unknown }) => ((r.content as Array<{ text?: string }>)[0]?.text ?? "");

test("a valid payload returns structured content and a markdown fallback", () => {
  const r = showTable({ columns: [{ key: "city", label: "City" }], rows: [{ city: "Oslo" }] });
  assert.equal(r.structuredContent.component, "data_table");
  assert.equal(r.structuredContent.schemaVersion, "1");
  assert.match(textOf(r), /Oslo/);
});

test("invalid payloads throw a validation error naming the field", () => {
  assert.throws(
    () => showTable({ columns: [{ key: "a", label: "A", type: "color" }], rows: [{ a: "x" }] } as never),
    /type/,
  );
});

test("the instance metadata points at the registered resource", () => {
  assert.deepEqual(inkviewToolMeta(), { ui: { resourceUri: DEFAULT_APP_URI } });
  assert.deepEqual(inkviewToolMeta({ component: "map" }), {
    ui: { resourceUri: DEFAULT_APP_URI },
    inkview: { component: "map" },
  });
});

test("registerInkview registers the view bundle with the UI MIME type and CSP defaults", async () => {
  const registered: Array<{ name: string; uri: string; config: Record<string, unknown>; read: (uri: URL, extra: never) => Promise<any> }> = [];
  const server = {
    registerResource(name: string, uri: string, config: Record<string, unknown>, read: (uri: URL, extra: never) => Promise<any>) {
      registered.push({ name, uri, config, read });
      return { uri } as never;
    },
  };
  const inkview = registerInkview(server as never, { imageDomains: ["https://cdn.example.com"] });

  assert.equal(registered.length, 1);
  const [resource] = registered;
  assert.equal(resource.uri, DEFAULT_APP_URI);
  assert.equal(resource.config.mimeType, RESOURCE_MIME_TYPE);

  const result = await resource.read(new URL(resource.uri), {} as never);
  const [item] = result.contents;
  assert.equal(item.mimeType, RESOURCE_MIME_TYPE);
  assert.ok(item.text.includes('<div id="root">'), "the inlined view bundle is served");
  assert.ok(item._meta.ui.csp.resourceDomains.includes("https://cdn.example.com"));
  assert.equal(inkview.uri, DEFAULT_APP_URI);
  assert.equal(inkview.inkviewToolMeta().ui.resourceUri, DEFAULT_APP_URI);
});

test("a custom URI is used by the resource and the instance helper", () => {
  const uris: string[] = [];
  const server = { registerResource: (_name: string, uri: string) => uris.push(uri) };
  const inkview = registerInkview(server as never, { uri: "ui://builder/view.html" });
  assert.deepEqual(uris, ["ui://builder/view.html"]);
  assert.equal(inkview.inkviewToolMeta({ component: "form" }).ui.resourceUri, "ui://builder/view.html");
});

interface Case {
  name: string;
  component: string;
  build: (data: any, options?: { limit?: number }) => { structuredContent: any; content?: unknown };
  sample: (n: number) => unknown;
  defaultCap: number;
  hardMax: number;
}

const cases: Case[] = [
  {
    name: "profile card",
    component: "profile_card",
    build: showProfileCard,
    sample: (n) => ({ name: "Ada Lovelace", highlights: Array.from({ length: n }, (_, i) => `Fact ${i}`) }),
    defaultCap: 6,
    hardMax: 50,
  },
  {
    name: "profile grid",
    component: "profile_grid",
    build: showProfiles,
    sample: (n) => ({ people: Array.from({ length: n }, (_, i) => ({ name: `Person ${i}` })) }),
    defaultCap: 24,
    hardMax: 200,
  },
  {
    name: "table",
    component: "data_table",
    build: showTable,
    sample: (n) => ({
      columns: [{ key: "city", label: "City" }],
      rows: Array.from({ length: n }, (_, i) => ({ city: `City ${i}` })),
    }),
    defaultCap: 50,
    hardMax: 500,
  },
  {
    name: "result list",
    component: "result_list",
    build: showResults,
    sample: (n) => ({
      results: Array.from({ length: n }, (_, i) => ({ title: `Result ${i}`, url: `https://example.com/${i}` })),
    }),
    defaultCap: 20,
    hardMax: 200,
  },
  {
    name: "entity card",
    component: "entity_card",
    build: showEntityCard,
    sample: (n) => ({
      name: "Stripe",
      facts: Array.from({ length: n }, (_, i) => ({ label: `Fact ${i}`, value: "value" })),
    }),
    defaultCap: 8,
    hardMax: 50,
  },
  {
    name: "comparison",
    component: "comparison",
    build: showComparison,
    sample: (n) => ({
      items: Array.from({ length: n }, (_, i) => ({ name: `Option ${i}` })),
      criteria: ["Price"],
      values: Array.from({ length: n }, () => [1]),
    }),
    defaultCap: 5,
    hardMax: 20,
  },
  {
    name: "chart",
    component: "chart",
    build: showChart,
    sample: (n) => ({
      kind: "line",
      x: Array.from({ length: n }, (_, i) => `${i}`),
      series: [{ name: "Series", values: Array.from({ length: n }, (_, i) => i) }],
    }),
    defaultCap: 100,
    hardMax: 1000,
  },
  {
    name: "product grid",
    component: "product_grid",
    build: showProducts,
    sample: (n) => ({
      products: Array.from({ length: n }, (_, i) => ({ title: `Product ${i}`, url: `https://example.com/${i}` })),
    }),
    defaultCap: 12,
    hardMax: 100,
  },
  {
    name: "timeline",
    component: "timeline",
    build: showTimeline,
    sample: (n) => ({ events: Array.from({ length: n }, (_, i) => ({ date: "2020", title: `Event ${i}` })) }),
    defaultCap: 50,
    hardMax: 500,
  },
  {
    name: "task list",
    component: "task_list",
    build: showTasks,
    sample: (n) => ({ items: Array.from({ length: n }, (_, i) => ({ title: `Task ${i}`, status: "To do" })) }),
    defaultCap: 50,
    hardMax: 500,
  },
  {
    name: "document",
    component: "document_preview",
    build: showDocument,
    sample: (n) => ({ body: "x".repeat(n) }),
    defaultCap: 20000,
    hardMax: 100000,
  },
  {
    name: "form",
    component: "form",
    build: showForm,
    sample: (n) => ({
      fields: Array.from({ length: n }, (_, i) => ({ name: `field_${i}`, label: `Field ${i}`, type: "text" })),
    }),
    defaultCap: 12,
    hardMax: 50,
  },
  {
    name: "map",
    component: "map",
    build: showMap,
    sample: (n) => ({
      places: Array.from({ length: n }, (_, i) => ({ label: `Place ${i}`, lat: 55.6, lng: 12.6 })),
    }),
    defaultCap: 50,
    hardMax: 500,
  },
  {
    name: "listings",
    component: "listings",
    build: showListings,
    sample: (n) => ({ listings: Array.from({ length: n }, (_, i) => ({ title: `Listing ${i}` })) }),
    defaultCap: 20,
    hardMax: 100,
  },
  {
    name: "itinerary",
    component: "itinerary",
    build: showItinerary,
    sample: (n) => ({ days: Array.from({ length: n }, (_, i) => ({ stops: [{ title: `Stop ${i}` }] })) }),
    defaultCap: 14,
    hardMax: 60,
  },
];

for (const c of cases) {
  test(`${c.name}: a valid payload builds at the default cap`, () => {
    const result = c.build(c.sample(2));
    assert.equal(result.structuredContent.component, c.component);
    assert.equal(result.structuredContent.schemaVersion, "1");
    assert.ok(textOf(result).length > 0);
  });

  test(`${c.name}: an empty payload is rejected`, () => {
    assert.throws(() => c.build({}));
  });

  test(`${c.name}: the cap can be raised up to its hard maximum`, () => {
    const raised = c.defaultCap + 1;
    const accepted = c.build(c.sample(raised), { limit: raised });
    assert.equal(accepted.structuredContent.component, c.component);

    assert.throws(() => c.build(c.sample(raised)), "the default cap still applies without the option");
    assert.throws(() => c.build(c.sample(1), { limit: c.hardMax + 1 }), RangeError);
  });
}

test("a 300 row table renders when the limit is raised to 500", () => {
  const r = showTable(cases.find((c) => c.component === "data_table")!.sample(300) as never, { limit: 500 });
  assert.equal((r.structuredContent.data as { rows: unknown[] }).rows.length, 300);
  assert.match(textOf(r), /City 299/);
});

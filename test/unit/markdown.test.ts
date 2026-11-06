import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { serverComponents } from "../../src/components/server-registry.js";

const dirs = readdirSync("src/components", { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);

for (const dir of dirs) {
  const examples = JSON.parse(readFileSync(`src/components/${dir}/examples.json`, "utf8")) as { name: string; data: unknown }[];
  const metaSrc = readFileSync(`src/components/${dir}/meta.ts`, "utf8");
  const id = metaSrc.match(/component:\s*"([^"]+)"/)![1];
  const c = serverComponents.find((x) => x.meta.component === id)!;
  test(`${dir}: every example validates and has a markdown fallback`, () => {
    assert.ok(examples.length >= 3, "at least 3 examples");
    for (const ex of examples) {
      const data = c.schema.parse(ex.data);
      const md = c.toMarkdown(data);
      assert.ok(md.trim().length > 0, ex.name);
      assert.ok(!md.includes("undefined"), `${ex.name}: no "undefined" in markdown`);
    }
  });
}

const get = (id: string) => serverComponents.find((c) => c.meta.component === id)!;

test("profile card markdown: name heading, links, minimal", () => {
  const c = get("profile_card");
  assert.equal(c.toMarkdown(c.schema.parse({ name: "Ada" })), "### Ada");
  assert.match(c.toMarkdown(c.schema.parse({ name: "Ada", profileUrl: "https://x.org" })), /\[Profile\]\(https:\/\/x\.org\)/);
});

test("profile grid markdown: numbered people with headlines and profile links", () => {
  const c = get("profile_grid");
  assert.equal(
    c.toMarkdown(
      c.schema.parse({
        title: "Speakers",
        caption: "Top 2 of 9",
        people: [
          { name: "Mira Hoffmann", headline: "Staff Engineer", profileUrl: "https://x.io/mira" },
          { name: "Ada" },
        ],
      }),
    ),
    "### Speakers\n\n_Top 2 of 9_\n\n1. **Mira Hoffmann** — Staff Engineer — [Profile](https://x.io/mira)\n2. **Ada**",
  );
  assert.equal(c.toMarkdown(c.schema.parse({ people: [{ name: "Ada" }, { name: "Grace" }] })), "1. **Ada**\n2. **Grace**");
});

test("profile grid rejects fewer than 2 and more than 24 people", () => {
  const c = get("profile_grid");
  const one = c.schema.safeParse({ people: [{ name: "Ada" }] });
  assert.equal(one.success, false);
  assert.match(JSON.stringify(one.error!.issues), /at least 2 people/);
  const many = c.schema.safeParse({ people: Array.from({ length: 25 }, (_, i) => ({ name: `P ${i}` })) });
  assert.equal(many.success, false);
  assert.match(JSON.stringify(many.error!.issues), /at most 24 people/);
});

test("table markdown is a pipe table with caption and escaped pipes", () => {
  const c = get("data_table");
  const md = c.toMarkdown(
    c.schema.parse({ columns: [{ key: "a", label: "A" }, { key: "l", label: "L", type: "link" }], rows: [{ a: "x|y", l: { label: "Site", url: "https://s.io" } }], caption: "1 of 9" }),
  );
  assert.match(md, /^\| A \| L \|\n\| --- \| --- \|\n\| x\\\|y \| \[Site\]\(https:\/\/s\.io\) \|/);
  assert.match(md, /_1 of 9_/);
});

test("table rejects 51 rows with a helpful message", () => {
  const r = get("data_table").schema.safeParse({ columns: [{ key: "a", label: "A" }], rows: Array.from({ length: 51 }, (_, i) => ({ a: i })) });
  assert.equal(r.success, false);
  assert.match(JSON.stringify(r.error!.issues), /at most 50 rows/);
});

test("table rejects an unknown column type", () => {
  assert.equal(get("data_table").schema.safeParse({ columns: [{ key: "a", label: "A", type: "emoji" }], rows: [{ a: 1 }] }).success, false);
});

test("result list markdown is a numbered list of links", () => {
  const c = get("result_list");
  assert.equal(c.toMarkdown(c.schema.parse({ results: [{ title: "T", url: "https://t.io" }] })), "1. [T](https://t.io)");
  assert.equal(c.schema.safeParse({ results: Array.from({ length: 21 }, () => ({ title: "t", url: "https://t.io" })) }).success, false);
});

test("entity card markdown lists facts", () => {
  const c = get("entity_card");
  assert.match(c.toMarkdown(c.schema.parse({ name: "Acme", facts: [{ label: "Founded", value: "1999" }] })), /- \*\*Founded:\*\* 1999/);
});

test("comparison markdown: criteria rows, items columns, recommendation", () => {
  const c = get("comparison");
  const md = c.toMarkdown(c.schema.parse({ items: [{ name: "A" }, { name: "B" }], criteria: ["X"], values: [[true], [{ rating: 3 }]], recommended: "B", reason: "Cheaper" }));
  assert.match(md, /\|  \| A \| B ★ \|/);
  assert.match(md, /\| X \| Yes \| 3\/5 \|/);
  assert.match(md, /\*\*Recommended: B\*\*\. Cheaper/);
  assert.equal(c.schema.safeParse({ items: [{ name: "A" }], criteria: ["X"], values: [[1]] }).success, false);
});

test("chart rejects mismatched lengths and names the series", () => {
  const r = get("chart").schema.safeParse({ kind: "line", x: ["a", "b", "c"], series: [{ name: "Revenue", values: [1, 2] }] });
  assert.equal(r.success, false);
  assert.match(JSON.stringify(r.error!.issues), /Series \\"Revenue\\" has 2 values but x has 3/);
});

test("chart markdown starts with a summary and has a data table", () => {
  const c = get("chart");
  const md = c.toMarkdown(c.schema.parse({ kind: "bar", x: ["a", "b"], series: [{ name: "S", values: [1, 5] }], unit: "ms" }));
  assert.match(md, /^Bar chart over 2 points \(a to b\): S from 1 ms to 5 ms\./);
  assert.match(md, /\| a \| 1 \|/);
});

test("product grid markdown has prices and store links; no more than 12", () => {
  const c = get("product_grid");
  assert.equal(
    c.toMarkdown(c.schema.parse({ products: [{ title: "Tee", url: "https://s.io/tee", price: 9.5, currency: "USD", rating: 4.5, reviewCount: 10 }] })),
    "1. [Tee](https://s.io/tee) — $9.50 · ★ 4.5 (10)",
  );
  assert.equal(c.schema.safeParse({ products: Array.from({ length: 13 }, () => ({ title: "t", url: "https://t.io" })) }).success, false);
});

test("timeline markdown: full and minimal payloads", () => {
  const c = get("timeline");
  assert.equal(
    c.toMarkdown(
      c.schema.parse({
        title: "Northstar",
        caption: "2 of 7 events",
        events: [
          { date: "2020-04", title: "First release", detail: "Opened to everyone.", url: "https://example.com/release", category: "Product" },
          { date: "2019", title: "Founded" },
        ],
        source: { name: "Press kit", url: "https://example.com/press" },
      }),
    ),
    "### Northstar\n\n- 2019: Founded\n- 2020-04: [First release](https://example.com/release) · Product\n  Opened to everyone.\n\n_2 of 7 events_\n\n_Source: [Press kit](https://example.com/press)_",
  );
  assert.equal(c.toMarkdown(c.schema.parse({ events: [{ date: "2024", title: "Founded" }] })), "- 2024: Founded");
});

test("timeline markdown orders mixed date precision and validates input limits", () => {
  const c = get("timeline");
  const data = c.schema.parse({
    events: [
      { date: "2019-04-12", title: "Series A" },
      { date: "2019-01", title: "Prototype" },
      { date: "2019", title: "Founded" },
    ],
  });
  assert.equal(c.toMarkdown(data), "- 2019: Founded\n- 2019-01: Prototype\n- 2019-04-12: Series A");
  const invalidDate = c.schema.safeParse({ events: [{ date: "sometime in spring", title: "Launch" }] });
  assert.equal(invalidDate.success, false);
  assert.match(JSON.stringify(invalidDate.error!.issues), /YYYY-MM-DD, YYYY-MM or YYYY/);
  const tooMany = c.schema.safeParse({ events: Array.from({ length: 51 }, (_, i) => ({ date: "2024", title: `Event ${i}` })) });
  assert.equal(tooMany.success, false);
  assert.match(JSON.stringify(tooMany.error!.issues), /50 most relevant events.*caption/);
});

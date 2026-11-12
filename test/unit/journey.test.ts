import { test } from "node:test";
import assert from "node:assert/strict";
import { journeyFacts, journeyProblem, journeyText } from "../../src/components/journey.js";
import { serverComponents } from "../../src/components/server-registry.js";

const get = (id: string) => serverComponents.find((c) => c.meta.component === id)!;
const leg = (from: string, to: string, depart: string, arrive: string, carrier?: string) => ({ from, to, depart, arrive, carrier });

test("journey: a direct flight with offsets gets a computed duration", () => {
  const j = { segments: [leg("SYD", "HND", "2026-03-12T10:20+11:00", "2026-03-12T17:55+09:00", "Qantas")] };
  assert.equal(journeyText(j), "SYD 10:20 → HND 17:55 · Direct · 9h 35m · Qantas");
  assert.equal(journeyFacts(j).minutes, 575);
});

test("journey: one stop overnight shows the day offset, the layover and the total", () => {
  const j = {
    segments: [
      leg("SYD", "SIN", "2026-03-12T09:15+11:00", "2026-03-12T14:25+08:00", "Singapore Airlines"),
      leg("SIN", "NRT", "2026-03-12T23:55+08:00", "2026-03-13T07:40+09:00", "Singapore Airlines"),
    ],
  };
  assert.equal(journeyText(j), "SYD 09:15 → NRT 07:40 (+1) · 1 stop SIN 9h 30m · 24h 25m · Singapore Airlines");
});

test("journey: without offsets the total is never guessed, but a same-place layover is known", () => {
  const j = { segments: [leg("SYD", "CNS", "2026-03-12T06:05", "2026-03-12T08:10", "Jetstar"), leg("CNS", "NRT", "2026-03-12T11:30", "2026-03-12T17:35", "Jetstar")] };
  assert.equal(journeyText(j), "SYD 06:05 → NRT 17:35 · 1 stop CNS 3h 20m · Jetstar");
  assert.equal(journeyFacts(j).minutes, null);
  assert.equal(journeyText({ ...j, durationMinutes: 810 }), "SYD 06:05 → NRT 17:35 · 1 stop CNS 3h 20m · 13h 30m · Jetstar");
});

test("journey: a change of station has no layover without offsets, and durationMinutes wins over the times", () => {
  const j = {
    durationMinutes: 45,
    segments: [leg("Paris Nord", "London St Pancras", "2026-05-04T09:00+02:00", "2026-05-04T10:30+01:00", "Eurostar"), leg("London Euston", "Manchester", "2026-05-04T11:40", "2026-05-04T13:50", "Avanti")],
  };
  assert.equal(journeyText(j), "Paris Nord 09:00 → Manchester 13:50 · 1 stop London St Pancras to London Euston · 45m · Eurostar, Avanti");
  assert.equal(journeyText({ segments: [leg("A", "B", "2026-01-02T23:30", "2026-01-01T00:10")] }), "A 23:30 → B 00:10 (-1) · Direct");
});

test("journey validation names the segment and the field", () => {
  const ok = leg("A", "B", "2026-01-01T10:00", "2026-01-01T11:00");
  assert.equal(journeyProblem({ segments: [ok] }), null);
  assert.equal(journeyProblem({ segments: [ok, ok, ok, ok, ok, ok] }), null);
  assert.match(journeyProblem({ segments: [ok, ok, ok, ok, ok, ok, ok] })!, /at most 6 segments \(got 7\)/);
  assert.match(journeyProblem({ segments: [] })!, /needs segments/);
  assert.equal(journeyProblem({ segments: [ok, { ...ok, arrive: undefined }] }), "segment 2: arrive is missing");
  assert.match(journeyProblem({ segments: [{ ...ok, depart: "12 March, 9am" }] })!, /segment 1: depart must be an ISO 8601 date-time/);
  assert.match(journeyProblem({ segments: [{ ...ok, from: "x".repeat(41) }] })!, /from must be at most 40 characters/);
});

test("table: journey columns validate per row and print one line in markdown", () => {
  const c = get("data_table");
  const columns = [{ key: "route", label: "Route", type: "journey" }, { key: "price", label: "Price", type: "money", currency: "AUD" }];
  const route = { segments: [leg("SYD", "HND", "2026-03-12T10:20+11:00", "2026-03-12T17:55+09:00", "Qantas")] };
  assert.equal(
    c.toMarkdown(c.schema.parse({ columns, rows: [{ route, price: 1180 }, { price: 900 }] })),
    "| Route | Price |\n| --- | --- |\n| SYD 10:20 → HND 17:55 · Direct · 9h 35m · Qantas | 1180 |\n|  | 900 |",
  );
  const many = c.schema.safeParse({ columns, rows: [{ route }, { route: { segments: Array.from({ length: 7 }, () => route.segments[0]) } }] });
  assert.equal(many.success, false);
  assert.match(JSON.stringify(many.error!.issues), /Row 2, column \\"Route\\": a journey has at most 6 segments/);
  const missing = c.schema.safeParse({ columns, rows: [{ route: { segments: [{ from: "SYD", to: "HND", depart: "2026-03-12T10:20" }] } }] });
  assert.equal(missing.success, false);
  assert.match(JSON.stringify(missing.error!.issues), /Row 1, column \\"Route\\": segment 1: arrive is missing/);
});

test("comparison: journey values validate by item and criterion and print one line in markdown", () => {
  const c = get("comparison");
  const route = { type: "journey", segments: [leg("SYD", "HND", "2026-03-12T10:20+11:00", "2026-03-12T17:55+09:00", "Qantas")] };
  const base = { items: [{ name: "Qantas" }, { name: "Jetstar" }], criteria: ["Route", "Bag"] };
  assert.match(c.toMarkdown(c.schema.parse({ ...base, values: [[route, true], [null, false]] })), /\| Route \| SYD 10:20 → HND 17:55 · Direct · 9h 35m · Qantas \| – \|/);
  const bad = c.schema.safeParse({ ...base, values: [[route, true], [{ type: "journey", segments: [{ from: "SYD", to: "NRT", arrive: "2026-03-12T17:35" }] }, false]] });
  assert.equal(bad.success, false);
  assert.match(JSON.stringify(bad.error!.issues), /Jetstar, \\"Route\\": segment 1: depart is missing/);
});

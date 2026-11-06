import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
// @ts-expect-error plain ESM module without types
import { scoreRun, summarize, inventedValues, sourceFacts } from "../../evals/score.mjs";
import { serverComponents } from "../../src/components/server-registry.js";

const prompts = JSON.parse(readFileSync("evals/prompts.json", "utf8"));

test("eval set: coverage per component, no-render group, held-out share", () => {
  const ids = new Set();
  for (const p of prompts) {
    assert.ok(!ids.has(p.id), `duplicate id ${p.id}`);
    ids.add(p.id);
  }
  for (const c of serverComponents) {
    const n = prompts.filter((p: any) => p.expect === c.meta.tool).length;
    assert.ok(n >= 5, `${c.meta.tool} has ${n} prompts`);
  }
  assert.ok(prompts.filter((p: any) => p.expect === null).length >= 8, "at least 8 no-render prompts");
  const held = prompts.filter((p: any) => p.heldOut).length;
  assert.ok(held / prompts.length >= 0.2, `held-out share ${held}/${prompts.length}`);
  assert.ok(prompts.length >= 45 && prompts.length <= 70);
});

const ada = prompts.find((p: any) => p.id === "profile-ada");
const fact = prompts.find((p: any) => p.id === "none-fact");
const phones = prompts.find((p: any) => p.id === "prod-headphones");

// Recorded model responses (tool calls the model made), one per check.
test("choice: right component passes, wrong one fails", () => {
  const right = scoreRun(ada, [{ name: "show_profile_card", input: { name: "Ada Lovelace", headline: "Mathematician and writer" }, valid: true }]);
  assert.equal(right.choice, true);
  assert.equal(right.noRender, undefined);
  const wrong = scoreRun(ada, [{ name: "show_entity_card", input: { name: "Ada Lovelace" }, valid: true }]);
  assert.equal(wrong.choice, false);
  assert.equal(scoreRun(ada, []).choice, false, "text-only answer fails a render prompt");
});

test("valid: a call the server rejected fails", () => {
  const s = scoreRun(ada, [{ name: "show_profile_card", input: { headline: "x" }, valid: false }]);
  assert.equal(s.valid, false);
});

test("no invented fields: an avatar URL not in the source fails", () => {
  const s = scoreRun(ada, [
    { name: "show_profile_card", input: { name: "Ada Lovelace", avatarUrl: "https://upload.wikimedia.org/ada.jpg", profileUrl: "https://en.wikipedia.org/wiki/Ada_Lovelace" }, valid: true },
  ]);
  assert.equal(s.noInvented, false);
  assert.deepEqual(s.invented, ["show_profile_card avatarUrl: https://upload.wikimedia.org/ada.jpg"]);
});

test("no invented fields: prices parsed from strings and rescaled numbers are grounded", () => {
  const s = scoreRun(phones, [
    {
      name: "show_products",
      input: {
        products: [
          { title: "Sony WH-1000XM5", price: 399.99, currency: "USD", rating: 4.6, reviewCount: 12840, url: "https://shop.example.com/p/sony-wh1000xm5", imageUrl: "https://shop.example.com/img/xm5.jpg" },
        ],
      },
      valid: true,
    },
  ]);
  assert.equal(s.noInvented, true, s.invented.join());
  assert.equal(s.invented.length, 0);
  const facts = sourceFacts({ revenue: 1.8 });
  assert.deepEqual(inventedValues({ value: 1800000, pct: 37 }, facts), ["pct: 37"]);
});

test("no render: a fact question answered in text passes, a card fails", () => {
  assert.equal(scoreRun(fact, []).noRender, true);
  assert.equal(scoreRun(fact, [{ name: "show_entity_card", input: { name: "ETH Zurich" }, valid: true }]).noRender, false);
});

test("summary applies the release bar to tuned prompts only", () => {
  const runs = [
    { prompt: ada, score: scoreRun(ada, [{ name: "show_profile_card", input: { name: "Ada Lovelace" }, valid: true }]) },
    { prompt: fact, score: scoreRun(fact, []) },
    { prompt: { ...ada, heldOut: true }, score: scoreRun(ada, []) },
  ];
  const s = summarize(runs);
  assert.equal(s.overall.choice.rate, 1);
  assert.equal(s.heldOut.choice.rate, 0);
  assert.equal(s.meetsBar, true);
});

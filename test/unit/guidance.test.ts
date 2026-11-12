import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { serverComponents } from "../../src/components/server-registry.js";
import { serverInstructions, situations, skillMarkdown } from "../../packages/inkview/src/guidance/index.js";

test("every tool has a situation and appears in the instructions", () => {
  const tools = [...serverComponents.map((c) => c.meta.tool), "show_auto"];
  for (const t of tools) {
    assert.ok(situations.some((s) => s.tool === t), `${t} has a situation`);
    assert.ok(serverInstructions().includes(t), `${t} in server instructions`);
  }
});

test("the Skill is short and matches the generated file", () => {
  assert.ok(skillMarkdown().split("\n").length < 60, "Skill stays under 60 lines");
  assert.equal(readFileSync("plugin/skills/inkview/SKILL.md", "utf8"), skillMarkdown(), "run npm run gen:guidance");
});

test("the guidance tells agents how to pass provenance and where actions come from", () => {
  for (const text of [serverInstructions(), skillMarkdown(), readFileSync("docs/chatgpt-app.md", "utf8")]) {
    assert.match(text, /List in unverified the names of fields you did not fetch/);
    assert.match(text, /retrievedAt/);
    assert.match(text, /leave out values you cannot back/);
    assert.match(text, /come only from the fields you pass/);
    assert.match(text, /never books, reserves or pays/);
  }
  for (const id of ["listings", "product_grid", "comparison", "entity_card", "itinerary", "map"]) {
    const c = serverComponents.find((x) => x.meta.component === id)!;
    assert.match(c.meta.description, /unverified/, `${id} describes unverified`);
    assert.doesNotMatch(c.meta.description, /\bBook\b/, `${id} never offers booking`);
  }
});

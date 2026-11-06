import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { serverComponents } from "../../src/components/server-registry.js";
import { serverInstructions, situations, skillMarkdown } from "../../src/guidance/index.js";

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

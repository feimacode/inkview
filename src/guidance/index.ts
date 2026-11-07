/**
 * Single source for model guidance. Server instructions, the Claude Skill
 * (plugin/skills/inkview/SKILL.md) and the ChatGPT app instructions
 * (docs/chatgpt-app.md) are all generated from here by `npm run gen:guidance`,
 * and a unit test fails when the generated files drift.
 */
import { serverComponents } from "../components/server-registry.js";
import { autoMeta } from "../auto/tool.js";

/** Situation → tool, in the order a model should consider them. */
export const situations: Array<{ when: string; tool: string }> = [
  { when: "One person (candidate, speaker, founder, contact)", tool: "show_profile_card" },
  { when: "Several people (candidates, speakers, attendees, contacts)", tool: "show_profiles" },
  { when: "Dated events in a history, project milestones, a career or unfolding story", tool: "show_timeline" },
  { when: "To-dos, action items or issues with a status", tool: "show_tasks" },
  { when: "3 or more records with the same fields", tool: "show_table" },
  { when: "Web, news, paper or document search results", tool: "show_results" },
  { when: "One company, organization, product or place", tool: "show_entity_card" },
  { when: "2 to 5 options the user is choosing between", tool: "show_comparison" },
  { when: "Numbers over time or across categories", tool: "show_chart" },
  { when: "Shopping results (2 to 12 products)", tool: "show_products" },
  { when: "A draft email, message, post, letter or report to review, edit and approve", tool: "show_document" },
  { when: "3 or more details missing from the user (a short form)", tool: "show_form" },
  { when: "Structured data that fits none of the above clearly", tool: autoMeta.tool },
];

export const rules: string[] = [
  "Pass only data you gathered from your tools or the conversation. Never invent fields such as image URLs, links, prices or ratings.",
  "After rendering, add at most one sentence. Do not repeat what the component shows.",
  `Prefer the specific tool over ${autoMeta.tool} when the situation is clear.`,
  "Answer in plain text when the answer is a single fact, a short explanation, or code.",
];

const firstSentence = (s: string) => s.split(". ")[0].replace(/\.$/, "") + ".";

export function serverInstructions(): string {
  const lines = serverComponents.map((c) => `- ${c.meta.tool}: ${firstSentence(c.meta.description)}`);
  return [
    "Inkview draws UI components in the chat for data you already have. When your answer fits one of these, call the tool instead of writing the data out as text:",
    ...lines,
    `- ${autoMeta.tool}: when unsure which fits, pass any JSON and Inkview picks the component.`,
    ...rules,
  ].join("\n");
}

function table(): string {
  return ["| Situation | Tool |", "| --- | --- |", ...situations.map((s) => `| ${s.when} | \`${s.tool}\` |`)].join("\n");
}

export const skillDescription =
  "Show people, timelines, task lists, drafts, tables, search results, companies, comparisons, charts and products as interactive UI components in the chat with the Inkview MCP tools. Use whenever an answer presents structured data the user will scan, compare or act on.";

export function skillMarkdown(): string {
  return `---
name: inkview
description: ${skillDescription}
---

# Inkview components

The Inkview MCP server draws your data as native-looking components in the chat.
When your answer is structured data, gather it with your other tools first, then
call the matching Inkview tool instead of writing a markdown list or table.

${table()}

## Rules

${rules.map((r) => `- ${r}`).join("\n")}

Every tool also returns a markdown version, so text-only hosts still get a readable answer.
`;
}

export function chatgptInstructions(): string {
  return [
    "Inkview shows structured answers as interactive components. Gather data with your other tools first, then call the matching Inkview tool:",
    ...situations.map((s) => `- ${s.when}: ${s.tool}`),
    ...rules,
  ].join("\n");
}

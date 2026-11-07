// Tool-selection eval runner.
//
//   npm run evals                          # both modes, 3 runs per prompt, all prompts
//   npm run evals -- --mode tools --limit 3 --repeat 1
//   npm run evals -- --ids profile-ada,table-cities
//
// Reads the real tool definitions and server instructions from the built server
// (packages/inkview/dist/inkview.js over stdio), asks Claude each prompt with its source data, and
// validates every Inkview call by sending it to that same server.
// Credentials: ANTHROPIC_API_KEY, or an `ant auth login` profile.
// EVAL_MODEL (default claude-opus-5-5) and EVAL_EFFORT (default: the model's own) tune the run.
import Anthropic from "@anthropic-ai/sdk";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { report, scoreRun, summarize } from "./score.mjs";

const { values: opts } = parseArgs({
  options: {
    mode: { type: "string", default: "both" }, // tools | skill | both
    repeat: { type: "string", default: "3" },
    limit: { type: "string" },
    ids: { type: "string" },
    concurrency: { type: "string", default: "4" },
    out: { type: "string", default: "evals/reports" },
  },
});
const MODEL = process.env.EVAL_MODEL || "claude-opus-5-5";
const EFFORT = process.env.EVAL_EFFORT;
const repeat = Math.max(1, Number(opts.repeat));
const modes = opts.mode === "both" ? ["tools", "skill"] : [opts.mode];

let prompts = JSON.parse(readFileSync("evals/prompts.json", "utf8"));
if (opts.ids) {
  const ids = new Set(opts.ids.split(","));
  prompts = prompts.filter((p) => ids.has(p.id));
}
if (opts.limit) prompts = prompts.slice(0, Number(opts.limit));

// The Skill body without its frontmatter: what a host would add to the system prompt.
const skill = readFileSync("plugin/skills/inkview/SKILL.md", "utf8").replace(/^---[\s\S]*?---\s*/, "");

const mcp = new Client({ name: "inkview-evals", version: "0" });
await mcp.connect(new StdioClientTransport({ command: process.execPath, args: ["packages/inkview/dist/inkview.js"] }));
const instructions = mcp.getInstructions?.() ?? "";
const { tools: mcpTools } = await mcp.listTools();
const inkviewNames = new Set(mcpTools.map((t) => t.name));
/** @type {Anthropic.Tool[]} */
const tools = mcpTools.map((t) => ({ name: t.name, description: t.description ?? "", input_schema: t.inputSchema }));

const client = new Anthropic();

function userMessage(p) {
  if (p.source == null) return p.prompt;
  const data = typeof p.source === "string" ? p.source : JSON.stringify(p.source, null, 2);
  return `${p.prompt}\n\nHere is what my tools returned:\n\`\`\`json\n${data}\n\`\`\``;
}

async function runOne(p, mode) {
  const text = userMessage(p);
  const system = mode === "skill" ? `${instructions}\n\n${skill}` : instructions;
  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 16000,
      system,
      tools,
      ...(EFFORT ? { output_config: { effort: EFFORT } } : {}),
      messages: [{ role: "user", content: text }],
    });
    if (res.stop_reason === "refusal") return { prompt: p, mode, error: "refusal", score: scoreRun(p, [], text) };
    const calls = [];
    for (const block of res.content) {
      if (block.type !== "tool_use" || !inkviewNames.has(block.name)) continue;
      const r = await mcp.callTool({ name: block.name, arguments: block.input });
      calls.push({ name: block.name, input: block.input, valid: !r.isError });
    }
    return { prompt: p, mode, calls, score: scoreRun(p, calls, text), usage: res.usage };
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) throw e;
    const msg = e instanceof Anthropic.APIError ? `API ${e.status}: ${e.message}` : String(e?.message ?? e);
    return { prompt: p, mode, error: msg, score: scoreRun(p, [], text) };
  }
}

async function pool(jobs, n) {
  const out = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, jobs.length) }, async () => {
      while (i < jobs.length) {
        const job = jobs[i++];
        out.push(await job());
        if (out.length % 10 === 0) console.error(`… ${out.length}/${jobs.length}`);
      }
    }),
  );
  return out;
}

const results = {};
try {
  for (const mode of modes) {
    const jobs = prompts.flatMap((p) => Array.from({ length: repeat }, () => () => runOne(p, mode)));
    console.error(`Running ${jobs.length} requests (${mode}) on ${MODEL}…`);
    results[mode] = await pool(jobs, Number(opts.concurrency));
  }
} finally {
  await mcp.close();
}

const md = report({ model: MODEL, repeat, modes: results });
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
mkdirSync(opts.out, { recursive: true });
writeFileSync(`${opts.out}/${stamp}.md`, md);
writeFileSync(
  `${opts.out}/${stamp}.json`,
  JSON.stringify({ model: MODEL, repeat, summary: Object.fromEntries(Object.entries(results).map(([m, r]) => [m, summarize(r)])), runs: results }, null, 1),
);
console.log(md);
console.error(`Report: ${opts.out}/${stamp}.md`);
const bar = Object.values(results).every((r) => summarize(r).meetsBar);
process.exit(bar ? 0 : 2);

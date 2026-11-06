// Scoring for tool-selection evals. Pure functions: the runner and the unit tests share them.
//
// Four checks per run:
//   choice     render prompts: the first Inkview tool called is the expected one
//   valid      every Inkview call passed the server's schema (the server's own validation)
//   noInvented every URL and number in the tool input appears in the prompt's source data
//   noRender   no-render prompts: no Inkview tool was called
// "Invented" is deliberately narrow: URLs and numbers are what a model fabricates
// (avatars, links, prices, ratings); labels, captions and headlines are its own words.

const URL_RE = /https?:\/\/[^\s"'<>)\]]+/g;
const NUM_RE = /-?\d[\d,]*(?:\.\d+)?/g;

const normUrl = (u) => u.replace(/[.,;]+$/, "").replace(/\/+$/, "").toLowerCase();

function walk(v, visit, key = "") {
  if (Array.isArray(v)) v.forEach((x) => walk(x, visit, key));
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, visit, k);
  else visit(v, key);
}

/** Every URL and number that the source data (and the prompt text) contains. */
export function sourceFacts(source, promptText = "") {
  const urls = new Set();
  const nums = new Set();
  const addText = (s) => {
    for (const m of s.match(URL_RE) ?? []) urls.add(normUrl(m));
    for (const m of s.replace(URL_RE, " ").match(NUM_RE) ?? []) {
      const n = Number(m.replace(/,/g, ""));
      if (Number.isFinite(n)) nums.add(n);
      // "€39,00" style decimals
      if (/^\d+,\d{2}$/.test(m)) nums.add(Number(m.replace(",", ".")));
    }
  };
  walk(source, (v) => {
    if (typeof v === "number") nums.add(v);
    else if (typeof v === "string") addText(v);
  });
  addText(promptText);
  return { urls, nums };
}

const close = (a, b) => Math.abs(a - b) <= Math.max(1e-9, Math.abs(b) * 1e-6);

/** A number is grounded if it is in the source, or a unit rescaling of one (k, M, B, %). */
function grounded(n, nums) {
  if (Number.isInteger(n) && Math.abs(n) <= 1) return true; // flags and indexes
  for (const s of nums) {
    for (const f of [1, 1e3, 1e6, 1e9, 1e-2, 100]) if (close(n, s * f)) return true;
  }
  return false;
}

/** Values in a tool input that are not in the source. Keys like schemaVersion are ignored. */
export function inventedValues(input, facts) {
  const out = [];
  walk(input, (v, key) => {
    if (key === "schemaVersion") return;
    if (typeof v === "string") {
      for (const m of v.match(URL_RE) ?? []) if (!facts.urls.has(normUrl(m))) out.push(`${key}: ${m}`);
    } else if (typeof v === "number" && !grounded(v, facts.nums)) {
      out.push(`${key}: ${v}`);
    }
  });
  return out;
}

/**
 * Score one run.
 * @param prompt  an entry of evals/prompts.json
 * @param calls   [{ name, input, valid }] for every Inkview tool the model called, in order
 * @param userText the user message the model saw (its URLs and numbers count as source)
 */
export function scoreRun(prompt, calls, userText = prompt.prompt) {
  const facts = sourceFacts(prompt.source, userText);
  const invented = calls.flatMap((c) => inventedValues(c.input, facts).map((x) => `${c.name} ${x}`));
  const renders = prompt.expect !== null;
  return {
    choice: renders ? calls[0]?.name === prompt.expect : undefined,
    valid: calls.length ? calls.every((c) => c.valid) : undefined,
    noInvented: calls.length ? invented.length === 0 : undefined,
    noRender: renders ? undefined : calls.length === 0,
    called: calls.map((c) => c.name),
    invented,
  };
}

const pct = (xs) => {
  const d = xs.filter((x) => x !== undefined);
  return d.length ? { rate: d.filter(Boolean).length / d.length, n: d.length } : null;
};
const fmt = (r) => (r ? `${Math.round(r.rate * 100)}% (${r.n})` : "–");

export const RELEASE_BAR = { choice: 0.85, invented: 0.05 };

/** Aggregate scored runs: [{ prompt, mode, score }] → summary per group plus overall. */
export function summarize(runs) {
  const group = (rs) => ({
    choice: pct(rs.map((r) => r.score.choice)),
    valid: pct(rs.map((r) => r.score.valid)),
    noInvented: pct(rs.map((r) => r.score.noInvented)),
    noRender: pct(rs.map((r) => r.score.noRender)),
  });
  const byComponent = {};
  for (const r of runs) (byComponent[r.prompt.expect ?? "(no render)"] ??= []).push(r);
  const tuned = runs.filter((r) => !r.prompt.heldOut);
  const held = runs.filter((r) => r.prompt.heldOut);
  const overall = group(tuned);
  const inventedRate = overall.noInvented ? 1 - overall.noInvented.rate : 0;
  return {
    components: Object.fromEntries(Object.entries(byComponent).map(([k, rs]) => [k, group(rs)])),
    overall,
    heldOut: group(held),
    meetsBar: (overall.choice?.rate ?? 0) >= RELEASE_BAR.choice && inventedRate < RELEASE_BAR.invented,
  };
}

/** Markdown report for one or more modes. */
export function report({ model, repeat, modes }) {
  const lines = [`# Inkview tool-selection evals`, "", `Model \`${model}\`, ${repeat} run(s) per prompt.`, ""];
  for (const [mode, runs] of Object.entries(modes)) {
    const s = summarize(runs);
    lines.push(`## Mode: ${mode}`, "");
    lines.push(
      `**Release bar** (choice ≥ ${RELEASE_BAR.choice * 100}%, invented < ${RELEASE_BAR.invented * 100}%, tuned prompts): ${s.meetsBar ? "✅ met" : "❌ not met"}`,
      "",
    );
    lines.push("| Group | Choice | Valid input | No invented values | No render (when none needed) |", "| --- | --- | --- | --- | --- |");
    for (const [k, g] of Object.entries(s.components)) lines.push(`| ${k} | ${fmt(g.choice)} | ${fmt(g.valid)} | ${fmt(g.noInvented)} | ${fmt(g.noRender)} |`);
    lines.push(`| **Overall (tuned)** | ${fmt(s.overall.choice)} | ${fmt(s.overall.valid)} | ${fmt(s.overall.noInvented)} | ${fmt(s.overall.noRender)} |`);
    lines.push(`| **Held-out** | ${fmt(s.heldOut.choice)} | ${fmt(s.heldOut.valid)} | ${fmt(s.heldOut.noInvented)} | ${fmt(s.heldOut.noRender)} |`, "");
    const failing = runs.filter((r) => r.error || Object.entries(r.score).some(([k, v]) => ["choice", "valid", "noInvented", "noRender"].includes(k) && v === false));
    if (failing.length) {
      lines.push("### Failing runs", "", "| Prompt | Expected | Called | Problem |", "| --- | --- | --- | --- |");
      for (const r of failing) {
        const problems = [
          r.error && `error: ${r.error}`,
          r.score.choice === false && "wrong or no component",
          r.score.valid === false && "input rejected",
          r.score.noInvented === false && `invented ${r.score.invented.slice(0, 3).join("; ")}`,
          r.score.noRender === false && "rendered when text was right",
        ].filter(Boolean);
        lines.push(`| ${r.prompt.id}${r.prompt.heldOut ? " (held-out)" : ""} | ${r.prompt.expect ?? "none"} | ${r.score.called.join(", ") || "none"} | ${problems.join("; ").replace(/\|/g, "\\|")} |`);
      }
      lines.push("");
    }
  }
  return lines.join("\n");
}

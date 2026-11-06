# Tool-selection evals

Do models pick the right Inkview component, fill it with valid input, and avoid
inventing values? And do they stay in plain text when no component is needed?

```bash
export ANTHROPIC_API_KEY=...         # or `ant auth login`
npm run evals                        # both modes, 3 runs per prompt (about 300 requests)
npm run evals -- --mode tools --repeat 1 --limit 5   # quick check
npm run evals -- --ids profile-ada,table-cities
EVAL_MODEL=claude-sonnet-5-5 npm run evals          # another model
```

Or run the **Evals** workflow from the Actions tab (needs the `ANTHROPIC_API_KEY`
secret). The report lands in the job summary and the `eval-report` artifact.

## How it works

- `prompts.json`: 50 prompts. Each has the user's ask, the `source` data their
  other tools "returned", and the `expect`ed tool (`null` = answer in text).
  At least 5 per component, 9 no-render prompts, 10 marked `heldOut`.
- `run.mjs` starts the built server over stdio, takes its real tool definitions
  and `initialize` instructions, and sends each prompt to Claude in two modes:
  **tools** (tools + server instructions, as a host sends them) and **skill**
  (the same plus the plugin Skill). Every Inkview call is sent back to the
  server, so "valid" means the server's own schema accepted it.
- `score.mjs` scores each run on four checks:

| Check | Passes when |
| --- | --- |
| Choice | the first Inkview tool called is the expected one (render prompts) |
| Valid input | the server accepted every Inkview call |
| No invented values | every URL and number in the input appears in the source data (unit rescaling such as 1.8 → 1,800,000 is allowed) |
| No render | no Inkview tool was called (no-render prompts) |

## Release bar

On tuned (non-held-out) prompts: choice ≥ 85% and invented-value failures < 5%.
The runner exits with code 2 when the bar is missed. Tune tool descriptions in
`src/components/*/meta.ts` and guidance in `src/guidance/` against tuned prompts
only, then check the held-out scores have not dropped.

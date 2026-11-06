# Inkview MVP: task proposal

Status: proposal, for review · Date: 2026-11-06 · Source plan:
[Inkview: Product and Architecture Plan](https://claude.ai/artifact/DdR4jV9mm9L35Erh5JW88B)

## Goal

Prove one thing: **an agent picks the right Inkview component unprompted, and
it looks native in Claude and ChatGPT.** Ship as open source, with a free
hosted MCP server plus a local `npx` build.

MVP scope from the plan:

- One MCP server, two builds: local stdio (`npx`) and a stateless hosted HTTP server
- 7 render tools plus `show_auto`
- One component bundle that speaks the MCP Apps bridge (Claude and ChatGPT), with a markdown fallback for Claude Code and Codex
- A Claude plugin with a Skill that teaches when to render, and a ChatGPT developer-mode app
- An eval set of about 50 prompts

Out of scope: cart, checkout and payments (product actions only link to the
merchant), enterprise features, the SDK for MCP server builders (after MVP).

## What the pilot taught us

The v0.1 profile card (on `main`) worked in Claude Desktop. Things to carry forward:

| Finding | What it changes |
| --- | --- |
| One MCP Apps bridge (`@modelcontextprotocol/ext-apps`) works for Claude and ChatGPT | No separate `window.openai` adapter for now; keep a thin seam in case ChatGPT-only features are needed |
| `npx` cold install (83 packages, 36 MB) can exceed Claude Desktop's 2-minute start limit, as it did on WSL | Bundle the server into one dependency-free file (task M1.2) |
| The view bundle is 453 KB, mostly zod and the SDK | Shared runtime, no zod in the view, size budget in CI (M1.3) |
| Claude Code, including claude.ai/code, renders only text | Markdown fallback is a first-class output, and evals run there too |
| Images only load from domains declared in the CSP | Curated domain list plus initials or logo placeholders, never a general image proxy |

## Milestones

Sizes: S is up to half a day, M is 1 to 2 days, L is 3 to 5 days. These are
estimates for one developer, not measurements.

### M1. Foundation (week 1)

Make adding a component cheap before adding six of them.

| ID | Task | Size | Done when |
| --- | --- | --- | --- |
| M1.1 | **Component registry.** One folder per component (`schema.ts`, `markdown.ts`, `View.tsx`, `examples.json`); the server registers tools from the registry | M | Profile card moved over; adding a component touches only its folder |
| M1.2 | **Zero-install server bundle.** Bundle server and deps into `dist/inkview.js` so `npx` installs one package with no dependencies | M | Cold `npx @feimacode/inkview --version` under 10 s on a clean machine |
| M1.3 | **Shared view runtime.** One bundle `ui://inkview/v1/app.html` that routes on `structuredContent.component`; host theming, auto-resize, error and loading states; drop zod from the view | M | Bundle under 200 KB, budget enforced in CI |
| M1.4 | **Design tokens.** Map Inkview tokens onto MCP Apps host variables, light and dark, and check contrast | S | Screenshots in both themes pass a contrast check |
| M1.5 | **CI.** GitHub Actions: typecheck, smoke test (HTTP and stdio), render test with screenshots as artifacts, bundle size | S | Required check on PRs |
| M1.6 | **Visual test host.** Turn the test host into `npm run preview`, a local gallery that renders every component from its `examples.json` | S | One command shows all components in light and dark |

### M2. Components (weeks 2 to 3)

Each component needs: schema with "use when" description, markdown fallback,
view, at least 3 examples, an entry in the preview gallery, and render tests.

| ID | Component and tool | Size | Notes |
| --- | --- | --- | --- |
| M2.1 | Data table, `show_table` | L | Column types (text, number, money, date, link, badge), sort, filter, select rows and send back, CSV download; cap at 50 rows, the rest go to a "show more" app-only tool |
| M2.2 | Result list, `show_results` | M | Title, URL, snippet, favicon, date; open, pin, "dig deeper" |
| M2.3 | Entity card, `show_entity_card` | M | Company or place: logo, type, key facts, links; shares layout with the profile card |
| M2.4 | Comparison, `show_comparison` | M | 2 to 5 items across criteria, recommended item, "pick this one" sends back |
| M2.5 | Chart, `show_chart` | M | Line and bar; hover, toggle series; no heavy chart library (SVG) |
| M2.6 | Product grid, `show_products` | M | Image, price, rating, merchant, availability; sort by price or rating; "view at store" only |
| M2.7 | Profile card follow-ups | S | Move to the registry; "add to list" via `updateModelContext` |
| M2.8 | `show_auto` | M | Takes any JSON and picks a component from its shape; falls back to a table or markdown |

### M3. Hosts and distribution (week 4)

| ID | Task | Size | Done when |
| --- | --- | --- | --- |
| M3.1 | **Hosted build.** Stateless HTTP server in a container: no storage, no argument logging, rate limit, `/healthz`; deploy target to decide (see open questions) | M | Public `https://…/mcp` works as a Claude custom connector and a ChatGPT developer-mode app |
| M3.2 | **Claude plugin.** Plugin with the MCP server plus a Skill that says when to render (for example "after a people search, show profile cards") | M | Installs in Claude Desktop and Claude Code; the Skill measurably raises tool-pick rate in evals |
| M3.3 | **ChatGPT app.** Developer-mode setup, app instructions, test on a Business workspace | S | Every component renders in ChatGPT web |
| M3.4 | **`.mcpb` bundle** for one-click Claude Desktop install | S | Drag-and-drop install works on macOS and Windows |
| M3.5 | **npm release.** Publish `@feimacode/inkview` with provenance from CI on tag | S | `npx -y @feimacode/inkview` works |

### M4. Quality and launch (weeks 5 to 6)

| ID | Task | Size | Done when |
| --- | --- | --- | --- |
| M4.1 | **Eval set.** About 50 prompts across the 7 components: does the agent call the right tool, fill the schema correctly, and avoid inventing fields | L | Runs against Claude via the API; report per component |
| M4.2 | **Tool description tuning** from eval results | M | Correct component picked at least 85% of the time without explicit asks (target, to confirm) |
| M4.3 | **Host verification matrix.** Claude web, Desktop, mobile; ChatGPT web; Claude Code and Codex (text); VS Code | S | Table in the README with date checked |
| M4.4 | **Docs and demo site.** README, component gallery with screenshots, contributing guide | M | A new contributor can add a component from the guide alone |
| M4.5 | **Launch.** v0.5 release, demo video, listing submissions (Claude connector directory, ChatGPT app directory) | M | Submitted |

## Open questions for Iven

1. **npm name.** `@feimacode/inkview` (current) or the unscoped `inkview`, which was still free on 2026-11-05?
2. **One shared view bundle or one per component?** Recommend one shared bundle (M1.3): one build, one cache entry, consistent theming. A per-component file is smaller per render but repeats the runtime 7 times.
3. **Hosting.** Where should the hosted build run? `feima-infra` if it already has a container platform; otherwise Cloudflare Workers or Fly.io are cheap for a stateless server.
4. **Avatar and logo images.** Keep the curated CSP domain list (current approach), or allow a small allowlisted image proxy on the hosted build only?
5. **Order.** Proposal is table first (most used), then result list and entity card. Swap in product grid earlier if commerce demos matter more.

## Suggested next step

Approve or edit this list. I'll then open one GitHub issue per task with the
milestone labels and start on M1.1 to M1.3.

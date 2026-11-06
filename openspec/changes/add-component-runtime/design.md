# Design

## Context

The pilot (`src/server.ts`, `src/ui/profile-card.tsx`) wires one tool to one HTML file. The view imports zod to re-validate data, which with React and the MCP Apps SDK gives a 453 KB (132 KB gzipped) single-file bundle. See proposal.md for why this must change before more components land.

## Goals / Non-Goals

**Goals:**
- Adding a component touches only `src/components/<name>/` plus one registry line.
- One runtime for theming, sizing and states, so every component behaves the same.

**Non-Goals:**
- A public SDK for other MCP servers (after MVP).
- Server-side rendering or non-iframe hosts.

## Decisions

**One shared bundle, not one per component.** All v1 tools point at `ui://inkview/v1/app.html`, which routes on `structuredContent.component`. Hosts fetch and cache one resource; theming and fixes ship once. Alternative: one HTML per component, smaller per render but repeating the runtime seven times and multiplying CSP and cache entries. Revisit if the budget forces it; the registry makes splitting cheap.

**Component folder contract.** Each folder exports `schema` (zod, server only), `toMarkdown`, `View`, `examples.json`, plus `meta` (tool name, title, description, version). The server imports schemas; the view imports only `View` and light type guards. This keeps zod out of the view, since the server already validated the data.

**React stays, Preact is the fallback.** React 19 keeps the ecosystem and the official `useApp` hooks. If the bundle misses 100 KB gzipped after dropping zod, switch to `preact/compat` aliasing before cutting features.

**Tokens.** Inkview tokens (`--ink-*`) read the MCP Apps host variables first and fall back to Inkview values, under `prefers-color-scheme` and an explicit `data-theme` set from host context. Components use only `--ink-*` tokens, never raw colors.

**Preview gallery reuses the test host.** The minimal AppBridge host from the pilot's render test becomes `npm run preview`, loading each component's `examples.json`. The render tests drive the same host, so what developers see is what tests check.

## Risks / Trade-offs

- [Breaking resource URI] → Pre-1.0 and no public users yet; note it in the changelog.
- [Shared bundle grows with every component] → Size budget in tests; lazy-load heavy components (chart) if needed.
- [Hosts differ in which variables they send] → Every token has a default; screenshot tests in both themes with and without host variables.

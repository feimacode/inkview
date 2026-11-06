# Design

## Context

The pilot's `dist/main.js` imports the MCP SDK v2 packages, Express, zod and the MCP Apps server helpers at runtime, and reads the view HTML from disk. See proposal.md for the WSL timeout that motivates this change.

## Goals / Non-Goals

**Goals:**
- One file to download; nothing for npm to resolve.

**Non-Goals:**
- A single-executable binary without Node (possible later with Node SEA).

## Decisions

**Bundle with esbuild into `dist/inkview.js`.** esbuild targets Node 20, ESM, with all dependencies inlined and the view HTML embedded as a string import. Alternatives: `bun build` (needs Bun in CI), `ncc` (CJS-oriented). Expected size is 1 to 2 MB, which downloads in seconds.

**Keep Express only in HTTP mode, loaded lazily.** Stdio start-up does not parse Express, keeping the local path fast. If Express does not bundle cleanly, swap to the Node HTTP adapter.

**Name: `@feimacode/inkview`.** Scoped under the existing org. The unscoped `inkview` was free on 2026-11-05; reserving it as an alias can be decided at release without changing this design.

**Release from CI.** A tag `v*` runs tests, builds, publishes with `--provenance`, and attaches the `.mcpb` and tarball to the GitHub release.

## Risks / Trade-offs

- [Bundled dependencies miss security fixes] → Renovate or Dependabot plus a release on each SDK security update.
- [Dynamic requires break bundling] → The stdio smoke test runs against the bundled file, not the sources.

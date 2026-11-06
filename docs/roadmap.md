# Inkview MVP roadmap

The MVP is planned as [OpenSpec](https://github.com/Fission-AI/OpenSpec) changes in
[`openspec/changes/`](../openspec/changes). Each has a proposal (why and what), spec
deltas (behavior), a design where needed (how) and tasks. Shipped behavior lives in
[`openspec/specs/`](../openspec/specs); the profile card pilot is captured there as
`render-server` and `profile-card`.

Goal: an agent picks the right component unprompted, and it looks native in Claude
and ChatGPT. Source plan: [Inkview: Product and Architecture Plan](https://claude.ai/artifact/DdR4jV9mm9L35Erh5JW88B).

## Order

| Milestone | Change | Capability |
| --- | --- | --- |
| 1. Foundation | `add-component-runtime` | component-runtime, render-server (modified) |
| | `add-zero-install-package` | local-distribution |
| | `add-ci-pipeline` | none (tooling) |
| 2. Components | `add-data-table` | data-table |
| | `add-result-list` | result-list |
| | `add-entity-card` | entity-card |
| | `add-comparison` | comparison |
| | `add-chart` | chart |
| | `add-product-grid` | product-grid |
| | `update-profile-card-actions` | profile-card (adds shortlist) |
| | `add-show-auto` | auto-render |
| 3. Hosts | `add-hosted-server` | hosted-server |
| | `add-host-integrations` | host-integrations |
| 4. Quality and launch | `add-tool-selection-evals` | tool-selection-evals |
| | `prepare-public-launch` | none (docs, release) |

Every component change depends on `add-component-runtime`. Within milestone 2 the
order is a suggestion; components can be built in parallel.

## Working with the changes

```bash
npm i -g @fission-ai/openspec
openspec list                       # in-flight changes
openspec show add-data-table        # read one
openspec validate --all --strict    # check everything
```

In Claude Code use `/opsx:apply <change>` to implement a change and `/opsx:archive`
when it ships; in Codex use the `openspec-apply-change` and
`openspec-archive-change` skills.

## Decisions to confirm

These are recommended in the designs; changing one would change that design.

1. **npm name:** `@feimacode/inkview` (in `add-zero-install-package`). The unscoped `inkview` was free on 2026-11-05.
2. **One shared view bundle** rather than one per component (in `add-component-runtime`).
3. **Hosting:** Google Cloud Run, unless `feima-infra` already runs containers (in `add-hosted-server`).
4. **Images:** curated CSP domain list with initials or monogram fallback, no image proxy (in `add-hosted-server`).

# Inkview MVP roadmap

The MVP is planned as [OpenSpec](https://github.com/Fission-AI/OpenSpec) changes in
[`openspec/changes/`](../openspec/changes). Each has a proposal (why and what), spec
deltas (behavior), a design where needed (how) and tasks. Shipped behavior lives in
[`openspec/specs/`](../openspec/specs); the profile card pilot is captured there as
`render-server` and `profile-card`.

Direction (adopted 2026-11-12): Inkview is the rendering engine of the agent
entrance; every card renders, shows its provenance and hands off to the business.
See [direction.md](direction.md) for the three jobs and what Inkview does not do.

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

## After the MVP

Proposed 2026-11-06, not yet approved. These come from the plan's "After" phase
(v2 components, SDK for server builders, A2UI input). Store submissions stay in
`prepare-public-launch`.

| Milestone | Change | Capability |
| --- | --- | --- |
| 5. v2 components | `add-profile-grid` | profile-grid, profile-card (modified guidance) |
| | `add-timeline` | timeline |
| | `add-task-list` | task-list |
| | `add-document-preview` | document-preview |
| | `add-form` | form |
| | `add-map` | map, hosted-server (privacy page) |
| | `update-show-auto-v2` | auto-render (modified) |
| 6. Builders | `add-server-sdk` | server-sdk |
| | `add-a2ui-input` | a2ui-input |

Suggested order inside milestone 5: profile grid first (it finishes the shortlist
story), then timeline and task list, then document preview and form, then map,
which needs a tile provider decision. `update-show-auto-v2` goes last and covers
only the components that have shipped. Each new component adds eval prompts, but
running evals stays paused until there is budget.

Still open from the MVP (tasks in the existing changes): serve the privacy page
and hosted setup steps (`add-hosted-server` 3.2), deploy from `main` after CI
(`add-hosted-server` 2.3), the CONTRIBUTING dry run (`prepare-public-launch` 2.3),
and the host checks that need Iven.

## Consumer use cases

Proposed 2026-11-12 and implemented the same day (host checks pending). These come from the consumer use case
research of 2026-11-10 (flights, trips, local services, stays, events): Inkview is
for end users choosing between things, so the next components serve those tasks.

| Milestone | Change | Capability |
| --- | --- | --- |
| 7. Consumer | `add-listings` | listings |
| | `update-map-addresses` | map (modified) |
| | `add-itinerary` | itinerary |
| | `add-journey-segments` | data-table, comparison (both modified) |

Suggested order: listings first (it serves six of the twelve researched cases),
then the map update (small, and listings and itinerary both show maps), then
itinerary, then journey segments, which needs `add-data-table` and
`add-comparison` archived first. A `show_auto` update for the new components
follows once they ship. Geocoding addresses is left out on purpose; see the
design in `update-map-addresses`.

## Agent entrance, phase 1

Proposed 2026-11-12 from [direction.md](direction.md). Planning only so far.

| Milestone | Change | Capability |
| --- | --- | --- |
| 8. Trust and hand-off | `add-provenance-strip` | provenance |
| | `add-handoff-actions` | handoff-actions, component-runtime (modified) |

Order: hand-off first if speed matters, because it carries the URL-scheme
security fix; provenance can be built in parallel. Outside the repo: redeploy the
hosted server and submit to the Claude and ChatGPT directories (both need Iven).

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

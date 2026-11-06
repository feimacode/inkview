# Contributing to Inkview

## Setup

```bash
npm install                      # installs and builds
npx playwright install chromium  # for render checks
npm test
```

## Required checks

Every pull request runs the **CI** workflow (`.github/workflows/ci.yml`):

| Job | What it checks |
| --- | --- |
| `Test (Node 20)`, `Test (Node 22)` | typecheck, build, view bundle size (100 KB gzipped), MCP smoke tests over HTTP and stdio, render checks |
| `Test (Node 22)` extra steps | cold `npx` start under 15 s, `openspec validate --all --strict`, screenshots uploaded as the `screenshots` artifact |
| `Stdio (Windows)` | the server starts and answers over stdio on Windows |

Make `Test (Node 20)`, `Test (Node 22)` and `Stdio (Windows)` required in the
branch protection rules for `main`.

## Planning with OpenSpec

Behavior is specified in `openspec/specs/`, and planned work lives in
`openspec/changes/`. Propose a change before building anything that changes
behavior (`/opsx:propose` in Claude Code), implement it with `/opsx:apply`,
and archive it with `/opsx:archive` when it merges.

## Adding a component

See the component contract in `src/components/types.ts`. A component is one
folder in `src/components/<name>/` with:

- `meta.ts`: tool name, component id, title, and a description that says when to use it
- `schema.ts`: zod input schema (server only); accept unknown fields, cap list lengths
- `markdown.ts`: text fallback for text-only hosts
- `View.tsx`: the view, using `src/runtime/primitives.tsx` and `--ink-*` tokens only
- `examples.json`: at least three payloads, including a minimal one
- `server.ts`: re-exports `meta`, `schema` and `toMarkdown`

Then register it in `src/components/server-registry.ts`,
`src/components/view-registry.ts` and `src/components/examples.ts`, and add
interaction checks in `dev/tests/<name>.mjs`. `npm run preview` shows it in
light and dark.

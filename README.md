# Inkview

Agent-agnostic UI components for [MCP Apps](https://github.com/modelcontextprotocol/ext-apps).
Your agent already has the data; Inkview draws it as a native-looking component
right in the chat, in Claude, ChatGPT and any other host that renders MCP Apps.

> **Pilot (v0.1):** one component, the **profile card**. Table, result list,
> entity card, comparison, chart and product grid follow.

![Profile card](docs/img/profile-card-light.png)

## How it works

Inkview is an MCP server of *render tools*. The agent gathers data with its own
tools (search, LinkedIn, CRM...), then calls `show_profile_card` with it. The
server validates the data and returns:

- `structuredContent` for the UI, which the host draws from the tool's `ui://` resource in a sandboxed iframe
- a markdown version of the same card, for the model and for text-only hosts (Claude Code, Codex CLI)

The server is stateless: it stores nothing and never logs tool arguments.

| Piece | Where |
| --- | --- |
| One folder per component: `meta.ts`, `schema.ts`, `markdown.ts`, `View.tsx`, `examples.json` | `src/components/<name>/` |
| Render tools + the shared `ui://inkview/v1/app.html` resource | `src/server.ts` |
| HTTP (`/mcp`) and stdio entry point | `src/main.ts` |
| Shared view runtime (MCP Apps bridge, theming, states) | `src/runtime/` |
| Dev host, preview gallery, render checks | `dev/`, `scripts/` |

The server ships as one dependency-free file (`dist/inkview.js`, view HTML
inlined), so a cold `npx` start takes about a second.

## Run it locally

Inkview is a stdio MCP server you start with `npx`:

```json
{ "mcpServers": { "inkview": { "command": "npx", "args": ["-y", "@feimacode/inkview"] } } }
```

Claude Desktop renders the card; Claude Code and Codex print its markdown
version. Each release also has a `.mcpb` desktop extension for one-click
install in Claude Desktop. Setup for each app: **[docs/local-quickstart.md](docs/local-quickstart.md)**.

From source:

```bash
npm install            # also builds
node dist/inkview.js   # stdio
npm run dev            # HTTP on http://localhost:3001/mcp
npm run preview        # gallery of every component, light and dark, at http://localhost:5174
```

## Claude web and ChatGPT web

These connect from the cloud, so run `npm run dev` plus a tunnel
(`npm run tunnel`) and add the public URL as a connector:
[docs/testing-in-claude-and-chatgpt.md](docs/testing-in-claude-and-chatgpt.md).

## Test

```bash
npm test     # build, bundle size budget, MCP smoke tests (HTTP and stdio), render checks
```

Render checks draw every example in light, dark and 320 px, and check contrast,
keyboard focus and each component's actions. They need Playwright's Chromium
(`npx playwright install chromium`). Screenshots land in `dist-test/`.
See [CONTRIBUTING.md](CONTRIBUTING.md).

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3001` | HTTP port |
| `HOST` | `127.0.0.1` | Bind address (use `0.0.0.0` in a container) |
| `INKVIEW_IMAGE_DOMAINS` | | Extra avatar image origins for the component CSP, comma separated |
| `INKVIEW_UI_DOMAIN` | | Dedicated sandbox origin, if a host asks for one |

Avatars only load from origins declared in the CSP (GitHub, LinkedIn media,
Gravatar, unavatar.io, Wikimedia, Unsplash, X/Twitter images by default).
Anything else falls back to initials.

## Roadmap

The MVP is planned as OpenSpec changes: see [docs/roadmap.md](docs/roadmap.md) and [`openspec/`](openspec).

## License

MIT

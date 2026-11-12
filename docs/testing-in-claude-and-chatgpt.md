# Test Inkview in Claude web and ChatGPT web

Claude and ChatGPT call MCP servers from their own cloud, so they can't reach
`http://localhost:3001`. You run Inkview locally, open a tunnel that gives it a
public `https://` URL, and add that URL as a connector.

## 1. Start the server

```bash
npm install
npm run dev
```

You should see `Inkview 0.2.0 listening on http://127.0.0.1:3001/mcp`.
Leave this terminal open.

## 2. Open a tunnel

In a second terminal:

```bash
npm run tunnel
```

This uses **cloudflared** if it's installed, otherwise **ngrok**.

| Tool | Install | Notes |
| --- | --- | --- |
| cloudflared (recommended) | `brew install cloudflared` (macOS) or [download](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) | No account. Prints `https://<random>.trycloudflare.com` |
| ngrok | `brew install ngrok`, then `ngrok config add-authtoken <token>` from your ngrok dashboard | Free account. Prints a `Forwarding https://....ngrok-free.app` line |

Your **connector URL** is that https address plus `/mcp`, for example
`https://quiet-river-1234.trycloudflare.com/mcp`.

Check it from a browser: `https://<your-tunnel>/healthz` should show
`{"ok":true,...}`.

> Quick-tunnel URLs change every time you restart the tunnel. When that
> happens, update the URL in the connector settings (or delete and re-add it).

## 3. Add it to Claude (claude.ai)

Custom connectors work on every plan; the Free plan allows one.

1. Go to **Customize → Connectors** (Settings → Connectors on some versions).
2. Click **+ Add**, then **Add custom connector**.
3. Name: `Inkview (local)`. URL: your connector URL ending in `/mcp`.
4. Under **Authentication**, choose **No sign in**. Click **Add**.
5. In a new chat, click **+** at the lower left → **Connectors**, and make sure **Inkview (local)** is on.

Team or Enterprise: an owner adds the connector in **Organization settings → Connectors** first, then you click **Connect** on it.

## 4. Add it to ChatGPT (chatgpt.com)

Custom MCP apps need **Developer mode**. As of Nov 2026, full MCP Apps are in
beta for Business, Enterprise and Edu; Pro and other plans can use read-only
tools in developer mode. `show_profile_card` is marked read-only, so it should
work there too, but plan rules change often.

1. **Settings → Apps & Connectors → Advanced settings** → turn on **Developer mode**.
   (On a Business/Enterprise/Edu workspace an admin may have to allow it first.)
2. Back in **Settings → Apps & Connectors**, click **Create**.
3. Name: `Inkview (local)`. Description: `Draws profile cards`. MCP server URL: your connector URL ending in `/mcp`.
4. Authentication: **No authentication**. Tick the "I trust this application" box, then **Create**.
5. In a new chat, click **+** → **More** → pick **Inkview (local)**. ChatGPT only sees the tools of apps you select for that chat.

If you change the server's tools later, open the app in **Settings → Apps & Connectors** and click **Refresh** so ChatGPT picks up the new definitions.

## 5. Prompts to try

Explicit:

> Show a profile card for Ada Lovelace.

Realistic (the agent researches, then renders):

> Look up Linus Torvalds and show me his profile card. Use https://avatars.githubusercontent.com/u/1024025 as the photo.

> Find a well-known Rust core team member and show them as a profile card.

What you should see: a card with avatar or initials, headline, company and
location, highlights, skill chips, links, and three buttons:

- **Open profile** opens `profileUrl` through the host (Claude and ChatGPT may ask you to confirm external links).
- **Draft outreach** and **Dig deeper** send a follow-up message into the chat for you.

## Troubleshooting

| Symptom | Likely cause and fix |
| --- | --- |
| Connector fails to add / "couldn't connect" | Tunnel not running, or URL missing `/mcp`. Check `https://<tunnel>/healthz`. |
| Tool runs but only text appears | The host didn't render the UI. Start a new chat; on ChatGPT make sure developer mode is on and the app is selected for this chat. The markdown fallback is expected in Claude Code and Codex. |
| Card shows initials instead of the photo | The image's domain isn't in the CSP list. Restart with `INKVIEW_IMAGE_DOMAINS=https://your.cdn.com npm run dev`. |
| The model writes the profile as text instead of calling the tool | Ask explicitly ("show it as a profile card") — tool-choice tuning and a Skill come in a later milestone. |
| ngrok shows a browser warning page | Only affects browsers, not MCP clients. Ignore it, or use cloudflared. |

## Local hosts (no tunnel needed)

See [local-quickstart.md](local-quickstart.md) for Claude Desktop, Claude Code and Codex over stdio with `npx`.

# Run Inkview locally with npx

Inkview runs as a local stdio MCP server: your agent app starts it with `npx`,
talks to it over stdin/stdout, and nothing leaves your machine.

The package is one file with no dependencies, so the first `npx` start takes
about a second.

```bash
npx -y @feimacode/inkview --version   # prints the version
```

Before the first npm release, use a tarball instead: build one with `npm pack`
and replace `@feimacode/inkview` below with
`--package=/path/to/feimacode-inkview-<version>.tgz inkview`.

## Which apps show the card

| App | What you see | Why |
| --- | --- | --- |
| Claude Desktop (chat) | The interactive card | Renders MCP Apps for local servers |
| VS Code + Copilot Chat | The card (experimental) | Needs `chat.mcp.apps.enabled` |
| Claude Code (terminal, desktop Code tab, claude.ai/code) | Markdown version of the card | Claude Code doesn't render MCP Apps yet |
| Codex CLI | Markdown version | Same |

So to *see* the component, use **Claude Desktop**. Claude Code is still useful
to check that the model picks the tool and fills the schema well.

## Claude Desktop

1. Settings → Developer → **Edit Config** (opens `claude_desktop_config.json`).
2. Add:
   ```json
   {
     "mcpServers": {
       "inkview": {
         "command": "npx",
         "args": ["-y", "@feimacode/inkview"]
       }
     }
   }
   ```
3. Quit and reopen Claude Desktop. **Inkview** appears under the + menu → Connectors.

If Claude Desktop can't find `npx` (common with nvm), use the full path from
`which npx` as `command`.

Or skip config files: download `inkview-<version>.mcpb` from the
[releases](https://github.com/feimacode/inkview/releases) and open it with
Claude Desktop.

**Claude Desktop under WSL:** the config lives at
`~/.config/Claude/claude_desktop_config.json` and paths are Linux paths. If the
first start times out, install once with `npm install -g @feimacode/inkview`
and set `"command"` to the full path from `which inkview`, with no `args`.

## Claude Code (terminal or desktop Code tab)

```bash
claude mcp add inkview -- npx -y @feimacode/inkview
claude mcp list        # inkview should show ✓ Connected
```

## Claude Code on the web (claude.ai/code)

Web sessions run in a cloud container, not on your machine, so they can't see
a local tarball. Once the code is on GitHub, add a `.mcp.json` to the repo the
session opens:

```json
{
  "mcpServers": {
    "inkview": { "command": "npx", "args": ["-y", "github:feimacode/inkview"] }
  }
}
```

(`npx` builds it from the repo on first run, which takes about a minute;
`["-y", "@feimacode/inkview"]` is faster once it's on npm.) The output is the
markdown version, as in the terminal.

## Codex CLI

`~/.codex/config.toml`:

```toml
[mcp_servers.inkview]
command = "npx"
args = ["-y", "@feimacode/inkview"]
```

## Prompts to try

> Show a profile card for Ada Lovelace.

> Look up Linus Torvalds and show his profile card. Use https://avatars.githubusercontent.com/u/1024025 as the photo.

The card has an avatar or initials, headline, company and location,
highlights, skill chips, links, and buttons: **Open profile**, **Draft
outreach** and **Dig deeper** (the last two send a follow-up message into the
chat).

## Debugging

```bash
npm run inspect     # opens the MCP Inspector against the local build
```

For Claude Desktop logs: `~/Library/Logs/Claude/mcp-server-inkview.log` on
macOS, `%APPDATA%\Claude\logs\mcp-server-inkview.log` on Windows.

## Later: Claude web and ChatGPT web

Those connect from the cloud and need an https URL. Run `npm run dev`
plus a tunnel; see [testing-in-claude-and-chatgpt.md](testing-in-claude-and-chatgpt.md).

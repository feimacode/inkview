# Self-hosting Inkview

The hosted server is one file (`dist/inkview.js`) with no runtime dependencies.
It is stateless, so any number of instances can run behind a load balancer.

## Docker

```bash
docker build -t inkview .
docker run -p 8080:8080 inkview
curl localhost:8080/healthz          # {"ok":true,"version":"..."}
MCP_URL=http://localhost:8080/mcp node scripts/smoke-test.mjs
```

Put it behind HTTPS (any reverse proxy or platform TLS) and add
`https://<your domain>/mcp` as a connector in Claude or an app in ChatGPT.

## Without Docker

```bash
HOST=0.0.0.0 PORT=8080 npx -y @feimacode/inkview --http
```

## Settings

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` / `HOST` | `3001` / `127.0.0.1` (Docker: `8080` / `0.0.0.0`) | Listen address |
| `INKVIEW_BODY_LIMIT` | `256kb` | Larger request bodies get HTTP 413 |
| `INKVIEW_RATE_LIMIT` | `120` | Requests per client IP per window; `0` turns it off. Excess gets HTTP 429 with `Retry-After` |
| `INKVIEW_RATE_WINDOW_MS` | `60000` | Rate-limit window |
| `INKVIEW_TRUST_PROXY` | off | Set to `1` behind a load balancer so the client IP comes from `X-Forwarded-For` |
| `INKVIEW_ALLOWED_HOSTS` | any | Comma-separated `Host` header allow-list (DNS rebinding protection) |
| `INKVIEW_LOG` | on | `off` disables the access log |
| `INKVIEW_UI_DOMAIN` | | Dedicated sandbox origin, if a host asks for one |
| `INKVIEW_IMAGE_DOMAINS` | | Extra image origins for the component CSP, comma separated |

## What gets logged

One JSON line per request on stderr: time, HTTP method, path, status, duration,
JSON-RPC method and, for `tools/call`, the tool name. Never arguments, results,
headers or query strings; `npm test` checks this with a sentinel value.
`/healthz` is not logged.

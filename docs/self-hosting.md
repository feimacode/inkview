# Self-hosting Inkview

The hosted server is one file (`packages/inkview/dist/inkview.js`) with no runtime dependencies.
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

## Prebuilt image

The **Image** workflow publishes `ghcr.io/feimacode/inkview:latest` (and
`:sha-<commit>`) on every push to `main`, and `:<version>` for each release tag (`v*`):

```bash
docker run -p 8080:8080 ghcr.io/feimacode/inkview:0.1.0
```

The feimacode deployment runs this image on the shared Azure VM behind Traefik
and Cloudflare, with the `inkview` Ansible role in `feimacode/feima-infra`.

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
| `INKVIEW_CLIENT_IP_HEADER` | | Header a trusted proxy sets to the real client IP, e.g. `cf-connecting-ip` behind Cloudflare. Takes precedence over `INKVIEW_TRUST_PROXY` for rate limiting |
| `INKVIEW_ALLOWED_HOSTS` | any | Comma-separated `Host` header allow-list (DNS rebinding protection) |
| `INKVIEW_LOG` | on | `off` disables the access log |
| `INKVIEW_UI_DOMAIN` | | Dedicated sandbox origin, if a host asks for one |
| `INKVIEW_IMAGE_DOMAINS` | | Extra image origins for the component CSP, comma separated |
| `INKVIEW_MAP_TILES` | `https://tile.openstreetmap.org/{z}/{x}/{y}.png` | Raster tile template with `{z}`, `{x}`, `{y}` and an optional `{s}`. Its host is added to the component CSP automatically. `off` disables tiles and leaves the neutral-grid fallback |
| `INKVIEW_MAP_ATTRIBUTION` | `© OpenStreetMap contributors` | Attribution shown on the map; set it to match your tile provider's terms |

For heavy or commercial use, point `INKVIEW_MAP_TILES` at your own tile server or a
licensed provider and set `INKVIEW_MAP_ATTRIBUTION` to its required credit. Tiles
load straight from the browser, so the provider must allow the app's sandbox origin
and be reachable by end users. The tile host is derived from the template and sent
with the component's CSP metadata, so a typo there silently leaves the map on the
neutral grid.

## What gets logged

One JSON line per request on stderr: time, HTTP method, path, status, duration,
JSON-RPC method and, for `tools/call`, the tool name. Never arguments, results,
headers or query strings; `npm test` checks this with a sentinel value.
`/healthz` is not logged.

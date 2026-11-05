#!/usr/bin/env bash
# Expose the local Inkview server to Claude web and ChatGPT web.
# Web clients connect from their own cloud, so http://localhost is not reachable.
# Usage: npm run tunnel            (uses cloudflared if installed, else ngrok)
#        PORT=3001 npm run tunnel
set -euo pipefail
PORT="${PORT:-3001}"

if ! curl -fsS "http://localhost:${PORT}/healthz" >/dev/null 2>&1; then
  echo "Inkview is not running on port ${PORT}. Start it first in another terminal: npm run dev" >&2
  exit 1
fi

if command -v cloudflared >/dev/null 2>&1; then
  echo "Starting a Cloudflare quick tunnel (no account needed)."
  echo "Your connector URL is the https://<random>.trycloudflare.com address printed below, plus /mcp"
  exec cloudflared tunnel --no-autoupdate --url "http://localhost:${PORT}"
elif command -v ngrok >/dev/null 2>&1; then
  echo "Starting an ngrok tunnel. Your connector URL is the Forwarding https address plus /mcp"
  exec ngrok http "${PORT}"
else
  cat >&2 <<'MSG'
No tunnel tool found. Install one:
  cloudflared (recommended, no account):  brew install cloudflared
                                          or https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
  ngrok (free account + authtoken):       brew install ngrok && ngrok config add-authtoken <token>
MSG
  exit 1
fi

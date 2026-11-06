# Design

## Context

The server is already stateless (fresh server and transport per request, see `render-server`). The hosted build is that server in a container plus edge limits. See proposal.md for why.

## Goals / Non-Goals

**Goals:**
- Near-zero operating cost at low traffic; scale to zero allowed.

**Non-Goals:**
- Multi-region active-active; a single region with fast restarts is enough for the MVP.

## Decisions

**Platform: a container on a scale-to-zero platform (Google Cloud Run recommended).** It runs the same Node bundle unchanged, has per-request billing, and request logs that can be restricted to metadata. Alternatives: `feima-infra` if it already runs containers (reuse beats new accounts), Fly.io (similar, smaller), Cloudflare Workers (cheapest, but the Node HTTP transport would need porting to Workers). Final pick depends on what `feima-infra` offers; the spec does not change either way.

**Rate limiting at the platform edge where available, in-process token bucket otherwise.** In-process limits reset per instance, which is acceptable at MVP scale.

**Logging.** A small middleware logs JSON-RPC method, tool name, status and duration. Request bodies are never passed to the logger; a test asserts a sentinel value from tool input never appears in captured logs.

**Images stay client-side.** No proxy (abuse and privacy risk); the view's CSP lists known image domains, unknown ones fall back to initials or monograms.

**Sandbox origin.** Set `ui.domain` per host format only if a host requires it for directory listing; keep it in config, not code.

## Risks / Trade-offs

- [Abuse as a free compute endpoint] → Body cap, rate limit, no outbound fetch; the server does little work per call.
- [Cold starts on scale-to-zero] → Small bundle (`add-zero-install-package`); keep one minimum instance if cold starts exceed 2 s.
- [Platform logs capture bodies by default] → Disable request body logging and verify with the sentinel test against the deployed service.

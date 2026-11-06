# Proposal

## Why

The Claude connector directory and the ChatGPT app directory accept only remote servers, and Claude mobile and ChatGPT web can only reach remote servers. A free hosted Inkview is the default way most end users will get it, so it must exist and must be safe to run for anyone.

## What Changes

- A public, stateless HTTP deployment of the same server at a stable `https://…/mcp` URL, with no sign-in.
- Abuse limits: request size cap and per-IP rate limit.
- Privacy: no storage, no logging of tool arguments or results, no image proxy.
- A stable sandbox origin (`ui.domain`) where hosts require one.
- Health check, error-rate monitoring and a deploy pipeline from `main`.
- A privacy page stating what the hosted server does and does not keep.

Out of scope: accounts, paid tiers, enterprise deployments, custom domains per customer.

## Capabilities

### New Capabilities
- `hosted-server`: The public hosted deployment: URL, no sign-in, limits, privacy guarantees and availability.

### Modified Capabilities

## Impact

- New deploy config (container image and platform config) and a deploy workflow.
- Needs a domain (for example `mcp.inkview.dev` or under feimacode) and a hosting account.
- Depends on `add-component-runtime`; benefits from `add-zero-install-package` (same bundle in the image).

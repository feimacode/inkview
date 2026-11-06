# Tasks

## 1. Server hardening

- [x] 1.1 Add a 256 KB body limit and per-IP rate limiting in HTTP mode; verify tests get 413 and 429
- [x] 1.2 Add metadata-only request logging; verify a test that a sentinel input value never appears in logs
- [x] 1.3 Make `ui.domain` and CSP image domains configurable by environment; verify the resource metadata reflects the config in a smoke test

## 2. Deployment

- [x] 2.1 Add a Dockerfile running the bundled server; verify the container passes the HTTP smoke test locally
- [ ] 2.2 Provision the hosting service, domain and TLS; verify `https://<domain>/healthz` returns the version
- [ ] 2.3 Add a deploy workflow from `main` after CI passes; verify a merge deploys and the version updates
- [ ] 2.4 Add an external uptime check on `/healthz` with alerting; verify a test alert arrives

## 3. Host verification and docs

- [ ] 3.1 Add the hosted URL as a Claude custom connector and a ChatGPT developer-mode app; verify every component renders in both and record results in the host matrix
- [ ] 3.2 Publish the privacy page and add hosted setup steps to the README; verify the steps work from a fresh account

# Proposal

## Why

Tests only run on a developer's machine today. With six components and a shared runtime coming, every PR needs typecheck, the MCP smoke tests and the render tests to run automatically, with screenshots reviewers can look at.

## What Changes

- GitHub Actions workflow on pull requests and `main`: install, typecheck, build, HTTP and stdio smoke tests, render tests with Playwright Chromium, bundle size check.
- Screenshots from the render tests uploaded as workflow artifacts.
- Matrix on Node 20 and 22, Ubuntu; a Windows job for the stdio test.

Out of scope: release publishing (`add-zero-install-package`), hosted deploys (`add-hosted-server`).

## Capabilities

### New Capabilities

### Modified Capabilities

None: tooling only, no product behavior changes (`skip_specs: true`).

## Impact

- New `.github/workflows/ci.yml`. Branch protection on `main` can then require it.

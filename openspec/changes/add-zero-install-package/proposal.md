# Proposal

## Why

In the pilot, `npx` had to install 83 packages (36 MB) on first start. On WSL this ran past Claude Desktop's 2-minute start limit, so the server never answered. End users install Inkview through `npx` or a desktop extension, so the first start has to be near instant and nothing should depend on their npm setup.

## What Changes

- Ship the server as one bundled file with no runtime dependencies, including the view HTML.
- Publish to npm as `@feimacode/inkview` from CI on version tags, with provenance.
- Build a `.mcpb` desktop extension for one-click install in Claude Desktop.
- `inkview --version` and `--help` for quick checks.

Out of scope: the hosted HTTP deployment (`add-hosted-server`), auto-update.

## Capabilities

### New Capabilities
- `local-distribution`: How users install and start Inkview on their own machine: npm package, `npx`, desktop extension, start-up time and platform support.

### Modified Capabilities

## Impact

- Build gains a server bundling step; `dependencies` in `package.json` becomes empty.
- New release workflow in GitHub Actions and an npm token or trusted publisher setup on the `feimacode` npm scope.
- README and local quickstart switch from the tarball to `npx -y @feimacode/inkview`.

# Tasks

## 1. Bundle

- [x] 1.1 Bundle the server and view HTML into `dist/inkview.js` with esbuild and move runtime deps to devDependencies; verify `npm pack` lists no dependencies and the stdio test passes against the bundle
- [x] 1.2 Load HTTP-only code lazily; verify `--http` smoke test passes and stdio start-up time is under 1 second
- [x] 1.3 Measure a cold `npx` start from a packed tarball with an empty cache in CI; verify it finishes under 15 seconds

## 2. Desktop extension

- [ ] 2.1 Add an `.mcpb` manifest and build step; verify the extension installs in Claude Desktop and the profile card renders

## 3. Release

- [x] 3.1 Add a tag-triggered release workflow that tests, builds, publishes `@feimacode/inkview` with provenance and attaches the `.mcpb`; verify with a dry run
- [ ] 3.2 Update README and `docs/local-quickstart.md` to `npx -y @feimacode/inkview`, including the WSL notes; verify each snippet against the published package

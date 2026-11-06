# Tasks

## 1. Workflow

- [ ] 1.1 Add `.github/workflows/ci.yml` running typecheck, build and `npm test` on Node 20 and 22; verify it passes on a PR
- [ ] 1.2 Install Playwright Chromium in CI and upload `dist-test/*.png` as an artifact; verify screenshots download from the run
- [ ] 1.3 Add a Windows job running the stdio test; verify it passes
- [x] 1.4 Document required checks in CONTRIBUTING.md; verify the file names the workflow jobs

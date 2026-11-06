# Tasks

## 1. Registry and server

- [x] 1.1 Create `src/components/<name>/` contract (meta, schema, toMarkdown, View, examples.json) and a registry module; verify typecheck passes
- [x] 1.2 Move the profile card into `src/components/profile-card/` with no behavior change; verify the existing smoke and stdio tests pass
- [x] 1.3 Register render tools from the registry and serve one shared resource at `ui://inkview/v1/app.html`; verify the smoke test asserts both the tool's resource URI and the resource MIME type

## 2. Shared view runtime

- [x] 2.1 Build the runtime shell: host connection, routing on `structuredContent.component`, early render from tool input, unknown-component text fallback; verify render tests cover a known and an unknown component
- [x] 2.2 Add loading, cancelled and connection-error states; verify render tests cover each state
- [x] 2.3 Add auto-resize and 320 px reflow; verify a render test at 320 px finds no horizontal scroll
- [x] 2.4 Remove zod from the view bundle and add a size check (100 KB gzipped) to `npm test`; verify the check fails when the limit is lowered below the current size

## 3. Tokens and accessibility

- [x] 3.1 Define `--ink-*` tokens over host variables with light and dark defaults; verify screenshots in both themes, with and without host variables
- [x] 3.2 Add an automated contrast and keyboard-focus check to the render tests; verify the profile card passes

## 4. Preview gallery

- [x] 4.1 Turn the test host into `npm run preview` that loads every component's examples in light and dark; document it in the README and verify the command opens the gallery

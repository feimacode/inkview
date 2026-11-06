# Proposal

## Why

The pilot put the profile card's schema, server wiring and view in one-off files, and its view bundle is 453 KB (mostly zod and the SDK). Adding six more components that way would copy the runtime six times and drift in look and behavior. A shared runtime has to land before the components do.

## What Changes

- A component registry: each component lives in one folder with its schema, markdown fallback, view and examples, and the server registers render tools from the registry.
- One shared view bundle served at `ui://inkview/v1/app.html` that picks the component from `structuredContent.component`. **BREAKING**: the profile card's resource URI changes from `ui://inkview/profile-card-v1.html`.
- Shared view behavior: early render from tool input, loading, error and cancelled states, host theming, auto-resize, keyboard-accessible actions.
- Design tokens mapped onto MCP Apps host variables, with Inkview defaults for light and dark.
- A bundle size budget, checked in tests.
- `npm run preview`: a local gallery that renders every component's examples in light and dark.
- The profile card moves into the registry with no behavior change.

Out of scope: new components (separate changes), hosted deployment, packaging.

## Capabilities

### New Capabilities
- `component-runtime`: How every Inkview view loads, picks its component, follows the host theme, sizes itself, and handles loading, error and cancel states.

### Modified Capabilities
- `render-server`: Render tools of one schema major version share one UI resource instead of one resource per component.

## Impact

- `src/` reorganized into `src/components/<name>/` plus `src/runtime/`; build config and tests updated.
- Hosts that cached the old profile card resource URI pick up the new one on the next tool list.
- Every later component change depends on this one.

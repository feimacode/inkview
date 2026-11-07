# Proposal

## Why

`show_auto` only knows the seven MVP components. Once the v2 components land, data shaped like a timeline, a set of places, a task list or several people would still fall through to a table or text.

## What Changes

- Detection rules for timeline (dated events), map (places with coordinates), task list (items with a status) and profile grid (two or more people).
- A new detection order, so the more specific shapes win over the table.
- The hint list accepts the new component names.
- Form and document preview are not auto-detected: they express an intent (ask, review), not a data shape.

Out of scope: detecting form or document intent, learning rules from usage.

## Capabilities

### New Capabilities

### Modified Capabilities
- `auto-render`: Shape detection covers timeline, map, task list and profile grid; the order changes.

## Impact

- `src/auto/detect.ts` and its tests.
- Depends on `add-timeline`, `add-map`, `add-task-list` and `add-profile-grid`; apply after they are archived. Rules for a component that has not shipped are left out.

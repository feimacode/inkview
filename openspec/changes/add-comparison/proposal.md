# Proposal

## Why

Choosing between options is a common end of a research task. A side-by-side comparison with a highlighted recommendation is clearer than paragraphs, and letting the user pick an option sends a clean decision back to the agent.

## What Changes

- New render tool `show_comparison` for 2 to 5 items across up to 12 criteria, with an optional recommended item and reason.
- Values can be text, numbers, yes or no, or a 1 to 5 rating.
- "Choose this" on each item sends the choice back to the agent.
- Markdown fallback as a table with items as columns.

Out of scope: weighting or scoring criteria in the UI, more than 5 items (use `show_table`).

## Capabilities

### New Capabilities
- `comparison`: Shows 2 to 5 options side by side across criteria, with a recommendation and a pick action, via `show_comparison`.

### Modified Capabilities

## Impact

- New folder `src/components/comparison/` registered in the component registry; new examples in the preview gallery.
- Depends on `add-component-runtime`.

# Proposal

## Why

Explicit tools give the best accuracy, but sometimes the model has a blob of JSON and no clear component in mind. `show_auto` lets it hand over any data and get the best matching component, which also makes Inkview useful with less prompting.

## What Changes

- New render tool `show_auto` that takes any JSON value and picks a component from its shape.
- Detection rules: one person to profile card, one organization to entity card, an array of products to product grid, an array of search results to result list, numeric series to chart, an array of same-shaped records to table, otherwise formatted text.
- The result says which component was chosen, so the model learns the explicit tool for next time.

Out of scope: model-assisted detection; nested layouts combining several components.

## Capabilities

### New Capabilities
- `auto-render`: Picks and renders the best Inkview component for arbitrary JSON via `show_auto`.

### Modified Capabilities

## Impact

- New folder `src/components/auto-render/` registered in the component registry; new examples in the preview gallery.
- Depends on `add-component-runtime`.

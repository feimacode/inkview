# Proposal

## Why

Agents often end up with numbers over time or across items. A small, accessible chart reads faster than a list of numbers and is something chat hosts only partly draw themselves.

## What Changes

- New render tool `show_chart` for line and bar charts with up to 5 series and 100 points per series.
- Hover or focus shows exact values; series can be toggled.
- Units and axis labels; values formatted in the user's locale.
- Markdown fallback as a table of the data plus a one-line summary.

Out of scope: pie, scatter, maps and dual axes; live or streaming data.

## Capabilities

### New Capabilities
- `chart`: Shows numeric series as an accessible line or bar chart via `show_chart`.

### Modified Capabilities

## Impact

- New folder `src/components/chart/` registered in the component registry; new examples in the preview gallery.
- Depends on `add-component-runtime`.

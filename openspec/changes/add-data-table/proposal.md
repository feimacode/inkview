# Proposal

## Why

Tables are the shape agents return most in search and research tasks (3 or more records with the same fields). Plain markdown tables can't sort, filter, or hand a selection back to the agent, and they break on wide data.

## What Changes

- New render tool `show_table` with typed columns: text, number, money, date, link, badge.
- Sort by column, filter by text, and select rows to send back to the agent.
- Shows up to 50 rows; larger tables are cut with a visible note so the model is never asked to re-type hundreds of rows.
- CSV download of the shown rows where the host allows downloads.
- Markdown fallback as a pipe table.

Out of scope: editing cells, server-side pagination of data Inkview does not hold, charts (`add-chart`).

## Capabilities

### New Capabilities
- `data-table`: Shows tabular records with typed columns, sorting, filtering, row selection and CSV export via `show_table`.

### Modified Capabilities

## Impact

- New folder `src/components/data-table/` registered in the component registry; new examples in the preview gallery.
- Depends on `add-component-runtime`.

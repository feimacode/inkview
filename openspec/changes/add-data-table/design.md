# Design

## Context

First component on the shared runtime (`add-component-runtime`) with real interaction state. See proposal.md for scope.

## Goals / Non-Goals

**Goals:**
- Fast with 50 rows at 320 px to desktop widths.

**Non-Goals:**
- Virtualized rendering for thousands of rows; the 50-row cap makes it unnecessary.

## Decisions

**Hard cap at 50 rows, enforced by the schema.** The render-tool pattern makes the model re-type every row as arguments, which is slow and costly. A schema error with a clear message teaches the model faster than silent truncation. Alternative: accept more and truncate, rejected because the model would believe it showed everything.

**No table library.** Sorting, filtering and selection over 50 rows are a few dozen lines; a library would cost bundle budget.

**Narrow screens: horizontal scroll inside the table only, first column sticky.** Cards-per-row on mobile was considered but loses column comparison.

**CSV via a Blob download**, shown only when the host context reports download support; otherwise the action is hidden.

## Risks / Trade-offs

- [Model ignores the cap] → The error message names the limit and how to summarize; evals track it.
- [Locale formatting differs by host] → Use `Intl` with the host's locale from host context.

# Spec Delta

## Purpose

Shows numbers over time or across categories as a line or bar chart in the chat, via the `show_chart` render tool.

## ADDED Requirements

### Requirement: Chart schema
`show_chart` SHALL take `kind` (line or bar), `x` (labels or ISO dates), `series` (1 to 5, each with `name` and numeric `values` matching `x` in length, at most 100 points) and optional `title`, `unit`, `xLabel`, `yLabel` and `source`.

#### Scenario: Line chart
- **WHEN** the agent passes a line chart with 2 series of 12 points
- **THEN** the chart draws 2 lines with a legend

#### Scenario: Length mismatch
- **WHEN** a series has a different number of values than `x`
- **THEN** the call is rejected with a validation error naming the series

### Requirement: Read exact values
Hovering or keyboard-focusing a point or bar SHALL show its series, x label and formatted value with unit.

#### Scenario: Keyboard focus
- **WHEN** the user focuses a bar with the keyboard
- **THEN** a tooltip shows the series name, label and value

### Requirement: Toggle series
Clicking a legend entry SHALL hide or show that series, and at least one series SHALL stay visible.

#### Scenario: Hide a series
- **WHEN** the user clicks a legend entry
- **THEN** that series disappears and the axis rescales

### Requirement: Accessible chart
The chart SHALL expose a text alternative summarizing the series and range, and series colors SHALL be distinguishable in light and dark themes.

#### Scenario: Screen reader
- **WHEN** a screen reader reaches the chart
- **THEN** it reads a summary naming each series and its minimum and maximum

### Requirement: Chart markdown fallback
The text result SHALL be a markdown table of x values by series, preceded by a one-line summary.

#### Scenario: Text-only host
- **WHEN** Claude Code calls `show_chart`
- **THEN** the user sees the data as a markdown table

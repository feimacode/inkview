# Spec Delta

## Purpose

Shows several options side by side across the same criteria so the user can decide, via the `show_comparison` render tool.

## ADDED Requirements

### Requirement: Comparison schema
`show_comparison` SHALL take `items` (2 to 5, each with `name` and optional `subtitle`, `imageUrl`, `url`), `criteria` (1 to 12 labels) and `values` (one value per item and criterion), plus optional `recommended` (an item name) and `reason`.

#### Scenario: Three options
- **WHEN** the agent passes 3 items and 5 criteria
- **THEN** the comparison shows 3 columns and 5 rows

#### Scenario: Mismatched values
- **WHEN** `values` misses a value for an item and criterion pair
- **THEN** that cell shows an empty marker rather than failing

### Requirement: Value display
Values SHALL render by type: yes or no as check and cross icons with text labels, ratings as 1 to 5 marks with an accessible label, numbers right-aligned, text as is.

#### Scenario: Boolean value
- **WHEN** a value is `true`
- **THEN** the cell shows a check icon labelled "Yes"

### Requirement: Recommendation highlight
When `recommended` names an item, that item SHALL be visually marked and the `reason` shown next to it.

#### Scenario: Recommended item
- **WHEN** the agent recommends the second item with a reason
- **THEN** the second column is highlighted and the reason is visible

### Requirement: Choose an option
Each item SHALL offer "Choose this", which sends a message to the agent stating the user's choice.

#### Scenario: User picks an option
- **WHEN** the user clicks "Choose this" on an item
- **THEN** a message saying the user chose that item is sent into the chat

### Requirement: Comparison markdown fallback
The text result SHALL be a markdown table with criteria as rows and items as columns, followed by the recommendation and reason.

#### Scenario: Text-only host
- **WHEN** Codex calls `show_comparison`
- **THEN** the user sees a markdown table and the recommendation line

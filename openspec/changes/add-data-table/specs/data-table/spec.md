# Spec Delta

## Purpose

Shows a set of records that share fields as an interactive table in the chat, via the `show_table` render tool.

## ADDED Requirements

### Requirement: Table schema
`show_table` SHALL take `columns` (key, label, type: text, number, money, date, link or badge, optional currency for money) and `rows` (objects keyed by column key), plus optional `title`, `caption` and `source`.

#### Scenario: Valid table
- **WHEN** the agent passes 2 columns and 5 rows
- **THEN** the table renders 5 rows under the 2 column labels

#### Scenario: Unknown column type
- **WHEN** a column has a type outside the allowed list
- **THEN** the call is rejected with a validation error

### Requirement: Row limit
`show_table` SHALL accept at most 50 rows, and its description SHALL tell the model to pass the most relevant 50 and state the total in `caption`.

#### Scenario: Too many rows
- **WHEN** the agent passes 51 rows
- **THEN** the call is rejected with an error telling it to send at most 50

### Requirement: Typed cell formatting
Cells SHALL be formatted by column type: numbers and money right-aligned in the user's locale, dates in a readable local format, links as clickable labels, badges as chips.

#### Scenario: Money column
- **WHEN** a money column has currency EUR and value 1234.5
- **THEN** the cell shows the amount formatted as euros, right-aligned

### Requirement: Sorting and filtering
The user SHALL be able to sort by any column, ascending or descending, and filter rows by text across all columns, without a new tool call.

#### Scenario: Sort by number
- **WHEN** the user clicks a number column header
- **THEN** rows reorder by that column's numeric value

### Requirement: Send selection back
The user SHALL be able to select rows and send them to the agent as a follow-up message that lists the selected rows.

#### Scenario: Selecting two rows
- **WHEN** the user selects 2 rows and clicks "Ask about selected"
- **THEN** a message naming those 2 rows is sent into the chat

### Requirement: CSV export
The table SHALL offer a CSV download of the rows currently shown, and SHALL hide the option when the host does not allow downloads.

#### Scenario: Download
- **WHEN** the user clicks "Download CSV"
- **THEN** a CSV file with the visible rows and column labels as headers is downloaded

### Requirement: Table markdown fallback
The text result SHALL be a markdown pipe table with column labels as headers, followed by the caption and source when present.

#### Scenario: Text-only host
- **WHEN** Claude Code calls `show_table`
- **THEN** the user sees a markdown table with the same rows

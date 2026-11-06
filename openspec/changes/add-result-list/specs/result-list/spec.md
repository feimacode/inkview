# Spec Delta

## Purpose

Shows ranked search or document results as a scannable list in the chat, via the `show_results` render tool.

## ADDED Requirements

### Requirement: Result list schema
`show_results` SHALL take `results` (1 to 20 items, each with `title` and `url` required and optional `snippet`, `source`, `faviconUrl`, `date`, `score`) plus optional `query` and `title`.

#### Scenario: Valid results
- **WHEN** the agent passes 8 results
- **THEN** the list renders 8 items in the given order

#### Scenario: Too many results
- **WHEN** the agent passes 21 results
- **THEN** the call is rejected with a validation error

### Requirement: Result item display
Each item SHALL show its title, its source or domain, its date when given, and its snippet truncated to three lines; a missing or blocked favicon SHALL fall back to a generic icon.

#### Scenario: Result without favicon
- **WHEN** a result has no `faviconUrl`
- **THEN** the item shows a generic icon and its domain

### Requirement: Open a result
Clicking a result's title SHALL ask the host to open its URL.

#### Scenario: Open
- **WHEN** the user clicks a result title
- **THEN** the host is asked to open that result's URL

### Requirement: Dig deeper
Each result SHALL offer "Dig deeper", which sends a follow-up message asking the agent to research that result.

#### Scenario: Dig deeper on the third result
- **WHEN** the user clicks "Dig deeper" on the third result
- **THEN** a message naming that result's title and URL is sent into the chat

### Requirement: Result list markdown fallback
The text result SHALL be a numbered list with each title linked to its URL, followed by source, date and snippet.

#### Scenario: Text-only host
- **WHEN** Codex calls `show_results`
- **THEN** the user sees a numbered markdown list of linked titles

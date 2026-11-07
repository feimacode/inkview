# Spec Delta

## Purpose

Asks the user for several structured inputs at once and sends the answers back to the agent, via the `show_form` render tool.

## ADDED Requirements

### Requirement: Form schema
`show_form` SHALL take `fields` (1 to 12), each with `name`, `label`, `type` (text, textarea, number, date, select, multiselect, checkbox, email or url) and optional `help`, `required`, `default`, `min`, `max` and `options` (required for select and multiselect, up to 20); plus optional `title`, `intro` and `submitLabel`.

#### Scenario: Valid form
- **WHEN** the agent passes 4 fields including a select with 3 options
- **THEN** the form renders 4 labelled controls

#### Scenario: Select without options
- **WHEN** a select field has no options
- **THEN** the call is rejected with an error naming the field

### Requirement: No secret fields
The schema SHALL reject field types and names meant for secrets (password, card number, CVV, social security or national ID), and the tool description SHALL say the answers are visible in the chat.

#### Scenario: Password field
- **WHEN** the agent passes a field named "password"
- **THEN** the call is rejected with an error saying the form cannot collect secrets

### Requirement: Validation before submit
The view SHALL check required fields, number and date ranges, and email and URL formats before submitting, and SHALL show each error next to its field and move focus to the first one.

#### Scenario: Missing required field
- **WHEN** the user clicks Submit with a required field empty
- **THEN** nothing is sent and the field shows "Required" with focus on it

### Requirement: Submit and cancel
"Submit" SHALL send one chat message with the form title and each label with its answer, and SHALL then lock the form showing "Sent"; "Cancel" SHALL send a message saying the user declined the form.

#### Scenario: Submit
- **WHEN** the user fills 3 fields and clicks Submit
- **THEN** a message listing the 3 labels and answers is sent and the form becomes read-only

### Requirement: Form markdown fallback
The text result SHALL list each field as a numbered question with its type hint, options and whether it is required, and ask the user to answer in chat.

#### Scenario: Text-only host
- **WHEN** Claude Code calls `show_form`
- **THEN** the user sees numbered questions they can answer in a reply

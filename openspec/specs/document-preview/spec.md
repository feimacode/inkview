# document-preview Specification

## Purpose

Shows one draft document for review, editing and approval in the chat, via the `show_document` render tool.

## Requirements

### Requirement: Document schema
`show_document` SHALL take `body` (markdown, at most 20,000 characters) and optional `title`, `kind` (email, message, post, letter, report or other), `meta` (for email: `to`, `cc`, `subject`; otherwise up to 6 label and value pairs) and `limit` (a character limit).

#### Scenario: Email draft
- **WHEN** the agent passes kind email, a subject, a recipient and a body
- **THEN** the view shows a header with To and Subject above the rendered body

#### Scenario: Body too long
- **WHEN** the body is longer than 20,000 characters
- **THEN** the call is rejected with an error naming the limit

### Requirement: Safe markdown rendering
The body SHALL be rendered from a markdown subset (headings, paragraphs, emphasis, code, lists, links, blockquotes, tables) without interpreting raw HTML, and links SHALL open through the host.

#### Scenario: HTML in the body
- **WHEN** the body contains `<script>` or `<img onerror>` markup
- **THEN** it is shown as literal text and nothing executes or loads

### Requirement: Edit in place
"Edit" SHALL switch the body to a plain text editor with the markdown source, and "Done" SHALL render the edited text; edits SHALL persist in the view until it is closed.

#### Scenario: User edits a sentence
- **WHEN** the user edits the body and clicks "Done"
- **THEN** the rendered body shows the edited text

### Requirement: Approve and copy
"Approve" SHALL send a message into the chat that states approval and contains the current title and full body; "Copy" SHALL copy the current body and SHALL be hidden when the clipboard is unavailable.

#### Scenario: Approve after editing
- **WHEN** the user edits the draft and clicks "Approve"
- **THEN** the sent message contains the edited body, not the original

### Requirement: Length count
The view SHALL show word and character counts, and when `limit` is set SHALL show the remaining characters and mark the count when it is over the limit.

#### Scenario: Over a post limit
- **WHEN** `limit` is 280 and the body has 300 characters
- **THEN** the count shows 20 over the limit

### Requirement: Document markdown fallback
The text result SHALL be the title as a heading, the metadata as a short list, and the body unchanged.

#### Scenario: Text-only host
- **WHEN** Codex calls `show_document`
- **THEN** the user sees the draft as markdown

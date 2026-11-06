# Spec Delta

## Purpose

Shows several people as a grid of compact profile cards in the chat, via the `show_profiles` render tool.

## ADDED Requirements

### Requirement: Profile grid schema
`show_profiles` SHALL take `people` (2 to 24), each using the profile card's person fields (name required), plus optional `title`, `caption` and `source`.

#### Scenario: Valid grid
- **WHEN** the agent passes 8 people with names and headlines
- **THEN** 8 compact cards render in a grid

#### Scenario: Too many people
- **WHEN** the agent passes 25 people
- **THEN** the call is rejected with an error telling it to send the 24 most relevant and state the total in `caption`

### Requirement: Compact cards
Each card SHALL show avatar (with the initials fallback), name, headline and up to two of location, company or one highlight, and SHALL open a full profile view in place when clicked.

#### Scenario: Expand one person
- **WHEN** the user clicks a card
- **THEN** that person's full profile card shows in place with a "Back to all" control

### Requirement: Multi-select actions
The user SHALL be able to select people and use "Ask about selected", which sends a message naming them, or "Add to shortlist", which adds them to the model context without a chat message and is hidden when the host cannot update model context.

#### Scenario: Shortlist three
- **WHEN** the user selects 3 people and clicks "Add to shortlist"
- **THEN** the 3 people are added to the model context and the shortlist bar lists them

#### Scenario: Ask about two
- **WHEN** the user selects 2 people and clicks "Ask about selected"
- **THEN** a message naming those 2 people is sent into the chat

### Requirement: Responsive grid
The grid SHALL show one column at 320 px and grow to as many columns as fit, with no page-level horizontal scroll.

#### Scenario: Narrow host
- **WHEN** the view is 320 px wide
- **THEN** cards stack in one column

### Requirement: Profile grid markdown fallback
The text result SHALL be a numbered list with each person's name in bold, their headline, and their profile link when present.

#### Scenario: Text-only host
- **WHEN** Codex calls `show_profiles`
- **THEN** the user sees a numbered list of the same people

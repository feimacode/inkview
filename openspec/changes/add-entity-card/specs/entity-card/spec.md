# Spec Delta

## Purpose

Shows one company, organization or place as a card in the chat, via the `show_entity_card` render tool.

## ADDED Requirements

### Requirement: Entity card schema
`show_entity_card` SHALL take `name` (required) and optional `kind` (company, organization, place or other), `logoUrl`, `tagline`, `description`, `facts` (up to 8 label and value pairs), `links` (up to 6), `websiteUrl` and `source`.

#### Scenario: Company with facts
- **WHEN** the agent passes a company with 4 facts
- **THEN** the card shows the name, kind and the 4 facts as label and value pairs

### Requirement: Logo fallback
The card SHALL show a monogram of the entity's name when no logo is given, the logo fails to load, or its domain is not allowed by the CSP.

#### Scenario: No logo
- **WHEN** `logoUrl` is absent
- **THEN** the card shows a monogram

### Requirement: Entity actions
The card SHALL offer "Open website" when `websiteUrl` is set, opening it through the host, and "Compare" which sends a message asking the agent to compare this entity with alternatives.

#### Scenario: Compare
- **WHEN** the user clicks "Compare"
- **THEN** a message asking to compare the entity with alternatives is sent into the chat

### Requirement: Entity markdown fallback
The text result SHALL show the name as a heading, kind and tagline, description, facts as a list of bold labels with values, links and source.

#### Scenario: Text-only host
- **WHEN** Claude Code calls `show_entity_card`
- **THEN** the user sees the entity as markdown with its facts listed

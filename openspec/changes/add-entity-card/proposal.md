# Proposal

## Why

Agents often research one company or place. A card with logo, type and key facts gives the same quick read as the profile card does for people, and the two should look like one family.

## What Changes

- New render tool `show_entity_card` for a company, organization or place: name, logo, type, description, key facts (label and value), links, source.
- Actions: open the website, and "compare" which asks the agent to compare it with alternatives.
- Shares layout and tokens with the profile card.
- Markdown fallback with facts as a definition-style list.

Out of scope: maps (v2), live data such as stock prices, people (`profile-card`).

## Capabilities

### New Capabilities
- `entity-card`: Shows one company, organization or place with logo, key facts and links via `show_entity_card`.

### Modified Capabilities

## Impact

- New folder `src/components/entity-card/` registered in the component registry; new examples in the preview gallery.
- Depends on `add-component-runtime`.

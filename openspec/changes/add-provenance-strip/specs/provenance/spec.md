# Spec Delta

## Purpose

Defines how Inkview components accept and show where their data came from, when it was checked, and which values the agent did not verify, so users can judge a card before acting on it.

## ADDED Requirements

### Requirement: Shared source shape
Every component that accepts `source` SHALL accept `name` (required), optional `url`, and optional `retrievedAt` as an ISO 8601 date-time, and SHALL keep accepting calls that pass only `name` and `url`.

#### Scenario: Existing call without a check time
- **WHEN** an agent passes `source` with only `name` and `url`
- **THEN** the call is valid and the footer shows the source without a check time

#### Scenario: Invalid check time
- **WHEN** `retrievedAt` is not a valid ISO 8601 date-time
- **THEN** the call is rejected with a validation error naming `retrievedAt`

### Requirement: Per-item sources
Listings, product grid items, comparison options, result list items, itinerary stops and map pins SHALL accept an optional per-item `source`, and the footer SHALL list each distinct source once.

#### Scenario: Stays from two sites
- **WHEN** 6 listings carry per-item sources from two different sites
- **THEN** the footer names both sites once each, with links

### Requirement: Unverified values
An item or single-entity component SHALL accept `unverified` as a list of its own field names, and each named value SHALL render with a visible "not checked" marker that has an accessible text label; unknown field names SHALL be ignored.

#### Scenario: Price recalled, not fetched
- **WHEN** a listing has `unverified: ["price"]`
- **THEN** the price shows with the "not checked" marker and a screen reader announces "not checked"

#### Scenario: Unknown field name
- **WHEN** `unverified` names a field the item does not have
- **THEN** the call is valid and nothing extra is shown

### Requirement: Provenance footer
Each component SHALL show one provenance footer with the source names (linked when `url` is present) and "checked" with a relative time when `retrievedAt` is present; the footer SHALL also note that some values were not checked when any `unverified` marker is shown.

#### Scenario: Recent check
- **WHEN** `retrievedAt` is 2 hours before the render
- **THEN** the footer reads "Source: <name> · checked 2 hours ago"

### Requirement: Stale price and availability note
Components that show price, availability or opening state SHALL add "may have changed" to the footer when the most recent `retrievedAt` is more than 24 hours before the render.

#### Scenario: Day-old prices
- **WHEN** a product grid's `retrievedAt` is 30 hours old
- **THEN** the footer says the prices were checked 1 day ago and may have changed

### Requirement: Missing source is visible
Components that show prices, ratings, phone numbers or availability SHALL show "No source given" in the footer when neither the component nor any item has a `source`; the call SHALL still render.

#### Scenario: Plumbers without a source
- **WHEN** `show_listings` is called with 5 listings with phone numbers and no source anywhere
- **THEN** the cards render and the footer reads "No source given"

### Requirement: Provenance in the markdown fallback
Markdown fallbacks SHALL include the source line with check time, and SHALL append "(not checked)" to each unverified value.

#### Scenario: Text-only host
- **WHEN** a text-only host receives a listing with `unverified: ["phone"]`
- **THEN** the markdown shows the phone number followed by "(not checked)"

### Requirement: Provenance guidance for agents
Tool descriptions and the shared guidance SHALL tell agents to pass `source` with `retrievedAt` for data they fetched, to list values they did not fetch in `unverified`, and to leave out values they cannot back rather than invent them.

#### Scenario: Guidance text
- **WHEN** the guidance is generated
- **THEN** it contains the instruction to use `unverified` for values the agent did not fetch

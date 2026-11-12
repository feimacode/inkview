# Spec Delta

## ADDED Requirements

### Requirement: Journey values
`show_comparison` SHALL accept a value of type journey, with the same fields and limits as the table's journey column, and SHALL render it with the same display and duration rules, stacked to fit the item's column; the markdown fallback SHALL write it as one line.

#### Scenario: Three flight finalists
- **WHEN** the agent passes 3 items with a "Route" criterion holding journey values
- **THEN** each item's column shows its journey with times, stops and duration

#### Scenario: Invalid journey value
- **WHEN** a journey value has a segment without `depart`
- **THEN** the call is rejected with an error naming the item, the criterion and the missing field

#### Scenario: Text-only host
- **WHEN** Codex calls `show_comparison` with journey values
- **THEN** the markdown table shows each journey as one readable line

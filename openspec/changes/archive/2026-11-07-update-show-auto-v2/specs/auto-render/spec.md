# Spec Delta

## MODIFIED Requirements

### Requirement: Shape detection
`show_auto` SHALL take `data` (any JSON) and an optional `hint`, and SHALL render the first matching component in this order: product grid, result list, map, timeline, task list, chart, profile grid, profile card, entity card, table, then plain formatted text.

#### Scenario: Array of records
- **WHEN** `data` is an array of 6 objects sharing the same keys and no more specific rule matches
- **THEN** the data renders as a table with one column per key

#### Scenario: One person
- **WHEN** `data` is an object with a name and a headline or job title
- **THEN** the data renders as a profile card

#### Scenario: Nothing matches
- **WHEN** `data` matches no component rule
- **THEN** the data renders as formatted text

#### Scenario: Places with coordinates
- **WHEN** `data` is an array of objects that each have a name or label and numeric latitude and longitude
- **THEN** the data renders as a map

#### Scenario: Dated events
- **WHEN** `data` is an array of objects that each have a date or year and a title or event, and no numeric series
- **THEN** the data renders as a timeline

#### Scenario: Items with status
- **WHEN** `data` is an array of objects that each have a title and a status, state or done flag
- **THEN** the data renders as a task list

#### Scenario: Several people
- **WHEN** `data` is an array of 2 to 24 objects that each have a name and a headline or job title
- **THEN** the data renders as a profile grid

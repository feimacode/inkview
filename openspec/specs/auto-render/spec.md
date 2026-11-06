# auto-render Specification

## Purpose
Lets an agent hand Inkview any JSON and get the best matching component, via the `show_auto` render tool.

## Requirements

### Requirement: Shape detection
`show_auto` SHALL take `data` (any JSON) and an optional `hint`, and SHALL render the first matching component in this order: product grid, result list, chart, profile card, entity card, table, then plain formatted text.

#### Scenario: Array of records
- **WHEN** `data` is an array of 6 objects sharing the same keys and no more specific rule matches
- **THEN** the data renders as a table with one column per key

#### Scenario: One person
- **WHEN** `data` is an object with a name and a headline or job title
- **THEN** the data renders as a profile card

#### Scenario: Nothing matches
- **WHEN** `data` matches no component rule
- **THEN** the data renders as formatted text

### Requirement: Hint override
A `hint` naming a component SHALL take precedence when `data` can be mapped to that component's schema.

#### Scenario: Hint to table
- **WHEN** the hint is "table" and `data` is an array of products
- **THEN** the data renders as a table

### Requirement: Report the chosen component
The text result SHALL name the component chosen and its explicit tool, followed by that component's markdown fallback.

#### Scenario: Model reads the result
- **WHEN** `show_auto` renders a product grid
- **THEN** the text result starts by naming `show_products`

### Requirement: Size limits
`show_auto` SHALL apply the chosen component's limits and SHALL reject input over 100 KB of JSON.

#### Scenario: Oversized input
- **WHEN** `data` exceeds 100 KB
- **THEN** the call is rejected with an error asking for a smaller selection

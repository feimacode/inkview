# Spec Delta

## MODIFIED Requirements

### Requirement: Map schema
`show_map` SHALL take `places` (1 to 50), each with a `label` and either both `lat` (-90 to 90) and `lng` (-180 to 180) or an `address`, and optional `detail`, `category`, `url`, `id` and `pinLabel` (up to 8 characters); plus optional `title`, `caption` and `source`.

#### Scenario: Valid map
- **WHEN** the agent passes 8 places with coordinates and labels
- **THEN** the map shows 8 pins and a list of 8 places

#### Scenario: Missing coordinates
- **WHEN** a place has an address but no `lat` and `lng`
- **THEN** the call is accepted and that place is listed without a pin

#### Scenario: Neither coordinates nor address
- **WHEN** a place has a label but no coordinates and no address
- **THEN** the call is rejected with an error saying each place needs coordinates or an address

#### Scenario: Half a coordinate
- **WHEN** a place has `lat` but no `lng`
- **THEN** the call is rejected with an error naming the missing field

### Requirement: Map actions
Each place SHALL offer "Open in maps" through the host, using its coordinates when present and otherwise its address, and the user SHALL be able to select places and send them with "Ask about selected".

#### Scenario: Ask about two places
- **WHEN** the user selects 2 places and clicks "Ask about selected"
- **THEN** a message naming the 2 places is sent into the chat

#### Scenario: Open an address-only place
- **WHEN** the user clicks "Open in maps" on a place that has only an address
- **THEN** the host is asked to open a maps search for that address

### Requirement: Map markdown fallback
The text result SHALL be a numbered list of places with label, address when present and coordinates when present, followed by the caption and source.

#### Scenario: Text-only host
- **WHEN** Claude Code calls `show_map`
- **THEN** the user sees a numbered list of the places

## ADDED Requirements

### Requirement: Places without coordinates
Places without coordinates SHALL appear in the list marked as not on the map, the map SHALL fit only the places with coordinates, and the view SHALL state how many places are on the map; Inkview SHALL NOT look up coordinates for an address.

#### Scenario: Mixed places
- **WHEN** 5 of 8 places have coordinates
- **THEN** the map shows 5 pins, the list shows 8 places with 3 marked "Not on map", and the view states "5 of 8 on map"

#### Scenario: No place has coordinates
- **WHEN** every place has only an address
- **THEN** the view shows the list with a notice that the places have no coordinates, and no tile is requested

### Requirement: Pin labels
When a place has a `pinLabel`, its pin SHALL show that text, and the label SHALL NOT appear in tile requests.

#### Scenario: Price on pins
- **WHEN** 4 places have `pinLabel` values such as "$210"
- **THEN** each of the 4 pins shows its label

#### Scenario: Label too long
- **WHEN** a `pinLabel` has 12 characters
- **THEN** the call is rejected with an error giving the 8-character limit

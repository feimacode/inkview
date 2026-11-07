# Spec Delta

## Purpose

Shows places with coordinates on an interactive map with a linked list in the chat, via the `show_map` render tool.

## ADDED Requirements

### Requirement: Map schema
`show_map` SHALL take `places` (1 to 50), each with `lat` (-90 to 90), `lng` (-180 to 180) and `label`, and optional `detail`, `category`, `address`, `url` and `id`; plus optional `title`, `caption` and `source`.

#### Scenario: Valid map
- **WHEN** the agent passes 8 places with coordinates and labels
- **THEN** the map shows 8 pins and a list of 8 places

#### Scenario: Missing coordinates
- **WHEN** a place has an address but no `lat` and `lng`
- **THEN** the call is rejected with an error saying coordinates are required and Inkview does not look up addresses

### Requirement: Fitted interactive map
The map SHALL open fitted to all places, and the user SHALL be able to pan and zoom by pointer, touch and keyboard.

#### Scenario: Keyboard zoom
- **WHEN** the map has focus and the user presses "+"
- **THEN** the map zooms in one level around its center

### Requirement: Linked selection
Selecting a pin SHALL highlight its list entry and show its detail, and selecting a list entry SHALL center and highlight its pin.

#### Scenario: Select from the list
- **WHEN** the user clicks the third place in the list
- **THEN** the map centers on its pin and shows its detail

### Requirement: Map actions
Each place SHALL offer "Open in maps" through the host, and the user SHALL be able to select places and send them with "Ask about selected".

#### Scenario: Ask about two places
- **WHEN** the user selects 2 places and clicks "Ask about selected"
- **THEN** a message naming the 2 places is sent into the chat

### Requirement: Configurable tiles with fallback
Tiles SHALL load only from the configured tile provider declared in the UI resource CSP, with its attribution shown; when tiles are off or fail to load, pins SHALL draw on a neutral grid and every other feature SHALL keep working.

#### Scenario: Tiles blocked
- **WHEN** the host blocks the tile domain
- **THEN** the pins show on a neutral grid with the list and actions intact

#### Scenario: Tile requests carry no tool data
- **WHEN** tiles load
- **THEN** tile requests contain only tile coordinates, never labels or other tool input

### Requirement: Map markdown fallback
The text result SHALL be a numbered list of places with label, address when present and coordinates, followed by the caption and source.

#### Scenario: Text-only host
- **WHEN** Claude Code calls `show_map`
- **THEN** the user sees a numbered list of the places

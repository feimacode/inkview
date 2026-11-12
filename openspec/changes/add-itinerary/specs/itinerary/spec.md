# Spec Delta

## Purpose

Shows a day-by-day plan of ordered stops with times, costs and a map for each day, which the user can reorder and export to a calendar, via the `show_itinerary` render tool.

## ADDED Requirements

### Requirement: Itinerary schema
`show_itinerary` SHALL take `days` (1 to 14), each with optional `date` and `label` and `stops` (0 to 12), each stop with `title` required and optional `id`, `time`, `endTime`, `kind` (see, eat, stay, travel or other), `note`, `cost` (`amount`, `currency`), `lat` and `lng`, `address`, `url` and `travel`; plus optional `title`, `caption` and `source`.

#### Scenario: Five-day trip
- **WHEN** the agent passes 5 days with 4 stops each
- **THEN** the view shows 5 days and the first day's 4 stops in order

#### Scenario: Titles only
- **WHEN** days have no dates and stops have only titles
- **THEN** the view shows "Day 1" onward with the stops listed and no map, cost or calendar action

#### Scenario: Too many days
- **WHEN** the agent passes 15 days
- **THEN** the call is rejected with an error telling it to send at most 14 days

### Requirement: Day view
The user SHALL be able to switch between days and an all-days view; each stop SHALL show its time, title, kind, note, cost and the travel note from the previous stop, with times shown as passed and not converted between time zones.

#### Scenario: Switch day
- **WHEN** the user selects day 3
- **THEN** the stops of day 3 are shown in order with their travel notes

### Requirement: Cost totals
The view SHALL show the sum of stop costs per day and for the whole plan, with one total per currency and no conversion.

#### Scenario: Two currencies
- **WHEN** a day has stops costing 3000 JPY, 1500 JPY and 20 AUD
- **THEN** the day total shows 4500 JPY and 20 AUD

### Requirement: Day map
When the selected day has at least one stop with coordinates, the view SHALL show a map with pins numbered in stop order and linked to the list; stops without coordinates SHALL stay in the list only; the map SHALL follow the map capability's tile configuration and fallback and SHALL NOT draw routes.

#### Scenario: Numbered pins
- **WHEN** day 2 has 4 stops and 3 have coordinates
- **THEN** the map shows 3 pins carrying those stops' positions in the day's order

#### Scenario: Select a stop
- **WHEN** the user selects the second stop in the list
- **THEN** the map centers on its pin and highlights it

### Requirement: Reorder and remove stops
The user SHALL be able to move a stop earlier or later within a day, move it to another day, remove it and undo the last edit, by pointer and by keyboard; a moved stop SHALL be marked as possibly needing a new time.

#### Scenario: Move to another day
- **WHEN** the user moves a stop from day 1 to day 2
- **THEN** it appears at the end of day 2, marked that its time may need updating

#### Scenario: Undo
- **WHEN** the user removes a stop and then chooses undo
- **THEN** the stop returns to its previous day and position

### Requirement: Report plan changes to the agent
After any edit the view SHALL update the model context with the current order of all days, and "Send changes" SHALL post a chat message listing the edits; when the host cannot update model context, only "Send changes" is offered.

#### Scenario: Agent sees the new order
- **WHEN** the user moves 2 stops and then asks "does this still work?"
- **THEN** the model context holds the plan in its new order

#### Scenario: Send changes
- **WHEN** the user clicks "Send changes" after removing a stop
- **THEN** a message naming the removed stop is sent into the chat

### Requirement: Add to calendar
The view SHALL offer an .ics download containing one event per stop that has a `time` on a day with a `date`, using local times without a time zone, and SHALL hide the option when no stop qualifies or the host does not allow downloads.

#### Scenario: Download
- **WHEN** a plan has 6 timed stops on dated days and the user clicks "Add to calendar"
- **THEN** an .ics file with 6 events is downloaded

#### Scenario: No dates
- **WHEN** no day has a `date`
- **THEN** "Add to calendar" is not shown

### Requirement: Itinerary markdown fallback
The text result SHALL list each day as a heading with its date or number, its stops in order with time, title, travel note and cost, and the day total, followed by the caption and source.

#### Scenario: Text-only host
- **WHEN** Codex calls `show_itinerary`
- **THEN** the user sees the plan as headed lists, one per day

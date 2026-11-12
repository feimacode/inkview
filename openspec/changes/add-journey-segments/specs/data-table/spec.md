# Spec Delta

## ADDED Requirements

### Requirement: Journey column type
`show_table` SHALL accept the column type `journey`, whose cell value holds `segments` (1 to 6, each with `from`, `to`, `depart` and `arrive` required and optional `carrier`, `number` and `mode`) and an optional `durationMinutes`.

#### Scenario: Flight options
- **WHEN** the agent passes 6 rows with a journey column and a money column
- **THEN** the table renders 6 rows with each journey drawn in its cell

#### Scenario: Too many segments
- **WHEN** a journey has 7 segments
- **THEN** the call is rejected with an error naming the row and the 6-segment limit

#### Scenario: Missing arrival
- **WHEN** a segment has no `arrive`
- **THEN** the call is rejected with an error naming the row and the missing field

### Requirement: Journey cell display
A journey cell SHALL show the first departure time and place, the last arrival time and place, a day offset mark when the arrival's local date differs from the departure's, the number of stops with each layover place, and the carriers; times SHALL be shown as passed, without conversion to another time zone.

#### Scenario: One stop overnight
- **WHEN** a journey departs SYD at 09:15 on 12 March, connects at SIN and arrives NRT at 06:40 on 13 March
- **THEN** the cell shows 09:15 SYD, 06:40 NRT with "+1", and "1 stop SIN"

#### Scenario: Direct
- **WHEN** a journey has one segment
- **THEN** the cell shows "Direct"

### Requirement: Durations only when known
Total duration SHALL be shown from `durationMinutes` when passed, otherwise computed only when the first departure and last arrival both carry UTC offsets, and otherwise omitted; layover length SHALL be shown only when it can be determined the same way or both times are at the same place.

#### Scenario: Duration passed
- **WHEN** a journey has `durationMinutes` 865
- **THEN** the cell shows "14h 25m"

#### Scenario: No offsets and no duration
- **WHEN** times have no UTC offsets and `durationMinutes` is absent
- **THEN** the cell shows no total duration

### Requirement: Journey sorting and filtering
Sorting a journey column SHALL order rows by total duration with unknown durations last, and the table filter SHALL match journey places, carriers and numbers.

#### Scenario: Sort by duration
- **WHEN** the user clicks a journey column header
- **THEN** rows reorder shortest journey first

#### Scenario: Filter by carrier
- **WHEN** the user types "Qantas" in the filter
- **THEN** only rows whose journey has a Qantas segment remain

### Requirement: Journey text form
The markdown fallback, CSV export and "Ask about selected" message SHALL write a journey as one line with departure, arrival, day offset, stops, duration and carriers, leaving out parts that are unknown.

#### Scenario: Text-only host
- **WHEN** Claude Code calls `show_table` with a journey column
- **THEN** each journey appears in the markdown table as one readable line

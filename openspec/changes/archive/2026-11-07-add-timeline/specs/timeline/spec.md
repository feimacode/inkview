# Spec Delta

## Purpose

Shows dated events in order on a vertical timeline in the chat, via the `show_timeline` render tool.

## ADDED Requirements

### Requirement: Timeline schema
`show_timeline` SHALL take `events` (1 to 50), each with `date` (an ISO date `YYYY-MM-DD`, a month `YYYY-MM` or a year `YYYY`), `title` and optional `detail`, `url` and `category`, plus optional `title`, `caption` and `source` for the whole timeline.

#### Scenario: Valid timeline
- **WHEN** the agent passes 6 events with year and month dates
- **THEN** the timeline renders 6 events in date order

#### Scenario: Unreadable date
- **WHEN** an event's date is "sometime in spring"
- **THEN** the call is rejected with an error naming the allowed date formats

#### Scenario: Too many events
- **WHEN** the agent passes 51 events
- **THEN** the call is rejected with an error telling it to send the 50 most relevant and state the total in `caption`

### Requirement: Date order and precision
Events SHALL be shown oldest first by default with a toggle for newest first, and each date SHALL be shown at the precision given (a year stays a year), formatted in the user's locale.

#### Scenario: Mixed precision
- **WHEN** one event is dated "2019" and another "2019-04-12"
- **THEN** the first shows "2019" and the second a full local date, and "2019" sorts before "2019-04-12"

### Requirement: Event detail and follow-up
Events with `detail` SHALL be collapsed to their title and expand on click or Enter; each event SHALL offer "Tell me more", which sends a message about that event into the chat, and "Open" when it has a `url`.

#### Scenario: Ask about one event
- **WHEN** the user clicks "Tell me more" on the event "Series A raised"
- **THEN** a message asking for more about "Series A raised" and its date is sent into the chat

### Requirement: Categories
When events carry a `category`, each category SHALL get a distinct color from the theme palette with a legend, and the user SHALL be able to filter by category.

#### Scenario: Filter
- **WHEN** the user turns off the category "Funding"
- **THEN** events in that category are hidden and the others stay in order

### Requirement: Timeline markdown fallback
The text result SHALL be a list of events in date order, each as "date: title", with the detail on the next line when present, followed by the caption and source.

#### Scenario: Text-only host
- **WHEN** Claude Code calls `show_timeline`
- **THEN** the user sees a dated markdown list in the same order

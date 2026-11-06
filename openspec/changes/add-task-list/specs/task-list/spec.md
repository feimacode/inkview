# Spec Delta

## Purpose

Shows items with a status as a checklist or kanban board in the chat, and lets the user update them, via the `show_tasks` render tool.

## ADDED Requirements

### Requirement: Task list schema
`show_tasks` SHALL take `items` (1 to 50), each with `title` and `status`, and optional `id`, `owner`, `due` (ISO date), `priority` (low, medium, high), `url` and `labels`; plus optional `statuses` (2 to 6 ordered names, default "To do", "In progress", "Done"), `title` and `source`. Every item's status SHALL be one of `statuses`.

#### Scenario: Default statuses
- **WHEN** the agent passes 5 items with statuses "To do" and "Done" and no `statuses`
- **THEN** the list renders with the three default statuses

#### Scenario: Unknown status
- **WHEN** an item's status is not in `statuses`
- **THEN** the call is rejected with an error listing the allowed statuses

### Requirement: Checklist and board layouts
The view SHALL show a checklist grouped by status by default and offer a board with one column per status; at 320 px the board SHALL scroll horizontally inside the view only.

#### Scenario: Switch to board
- **WHEN** the user picks "Board"
- **THEN** items appear in one column per status, in the given order

### Requirement: Update status in the view
The user SHALL be able to check an item off (move it to the last status) or move it to any status by keyboard or pointer, and the view SHALL keep the change while the conversation is open.

#### Scenario: Check off
- **WHEN** the user checks "Book venue"
- **THEN** it moves to "Done" and shows as checked

### Requirement: Report changes to the agent
After any change the view SHALL update the model context with the items whose status changed, and "Send changes" SHALL post a chat message listing them; when the host cannot update model context, only "Send changes" is offered.

#### Scenario: Agent sees changes
- **WHEN** the user moves 2 items and then asks "what's left?"
- **THEN** the model context lists the 2 moved items with their new statuses

#### Scenario: Send changes
- **WHEN** the user clicks "Send changes" after moving 2 items
- **THEN** a message naming both items and their new statuses is sent into the chat

### Requirement: Due and priority cues
Items past their due date and not in the last status SHALL be marked overdue, and high priority SHALL show a badge, without relying on color alone.

#### Scenario: Overdue
- **WHEN** an item in "To do" has a due date before today
- **THEN** it shows an "Overdue" label

### Requirement: Task list markdown fallback
The text result SHALL be a markdown checklist grouped under each status as a heading, with `[x]` for items in the last status and owner and due date after the title.

#### Scenario: Text-only host
- **WHEN** Claude Code calls `show_tasks`
- **THEN** the user sees a grouped markdown checklist

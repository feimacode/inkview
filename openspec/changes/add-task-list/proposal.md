# Proposal

## Why

Agents produce plans, to-do lists, issue lists and action items all the time, usually as markdown checklists the user can't tick. The plan's v2 list includes a task list or kanban for "items with status", with move and check-off actions.

## What Changes

- New render tool `show_tasks` for items with a status, shown as a checklist or as columns by status (kanban), user-switchable.
- The user can check items off or move them between statuses; changes stay in the view and in the model context, and "Send changes" posts a summary to the agent.
- Optional owner, due date, priority, link and labels per item.
- Up to 50 items; markdown fallback as a checklist grouped by status.

Out of scope: syncing with Jira, Linear, GitHub or any task service (Inkview never calls external services), storing state across conversations, drag-and-drop reordering within a column, subtasks.

## Capabilities

### New Capabilities
- `task-list`: Shows items with status as a checklist or kanban board that the user can update, via `show_tasks`.

### Modified Capabilities

## Impact

- New folder `src/components/task-list/`.
- Status changes use the existing `setModelContext` and `sendMessage` view actions; no new host capability.

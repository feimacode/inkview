# Proposal

## Why

Agents often answer "what happened and when": company history, a project's milestones, a person's career, a news story as it unfolded. As a bullet list, the order and the gaps between events are hard to see. The plan lists the timeline as the first v2 component.

## What Changes

- New render tool `show_timeline` for dated events, in order, on a vertical line.
- Each event has a date (a day, month or year), a title and optional detail, a link and a category.
- The user can expand an event's detail and send one event back to the agent with "Tell me more".
- Up to 50 events; markdown fallback as a dated list.

Out of scope: Gantt charts and durations with overlapping bars, editing events, calendar export (.ics), times of day and time zones.

## Capabilities

### New Capabilities
- `timeline`: Shows dated events in order, with expandable detail, via `show_timeline`.

### Modified Capabilities

## Impact

- New folder `src/components/timeline/`, registered in the server and view registries, examples and guidance.
- `show_auto` detection for timelines comes later in `update-show-auto-v2`.

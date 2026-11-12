# Proposal

## Why

Trip planning is one of the most common consumer asks ("five days in Kyoto with two kids"), and the answer has a shape no current component holds: days, each with ordered stops that have a time, a place and a cost. `show_timeline` shows dated events but not days of stops on a map, and `show_map` shows pins but not their order or day. The consumer research (2026-11-10) ranks this as a priority 1 case.

## What Changes

- New render tool `show_itinerary` for a plan of 1 to 14 days, each with up to 12 stops (time, title, kind, note, cost, place, link) and an optional travel note between stops.
- A day switcher; the selected day's stops in order with a cost total per day and for the trip.
- A map of the selected day with numbered pins in visit order, when stops have coordinates, reusing the map tile layer.
- The user can move a stop earlier or later, move it to another day, or remove it; changes update the model context, and "Send changes" posts them to the chat.
- "Add to calendar" downloads an .ics file of the timed stops when days have dates and the host allows downloads.

Out of scope: booking anything; fetching places, opening hours, travel times, weather or prices (the agent passes what it has); drawing routes along roads; live traffic; adding new stops in the view (the user asks the agent); sharing or saving the plan on a server; `show_auto` routing (a later `show_auto` update).

## Capabilities

### New Capabilities
- `itinerary`: Shows a day-by-day plan of ordered stops with a per-day map, editable order and calendar export, via `show_itinerary`.

### Modified Capabilities

None.

## Impact

- New folder `src/components/itinerary/`; shares the map tile layer and the task list's change-reporting pattern.
- A small .ics writer written in-house (no dependency).
- `src/guidance` gains a situation line separating itinerary (a plan by day) from timeline (events in time) and map (places without order).
- Shared bundle grows; it must stay inside the 100 KB gzipped budget.

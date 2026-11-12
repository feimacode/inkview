# Proposal

## Why

The consumer research (2026-11-10) found that most everyday "help me choose" tasks end in a list of things the user goes to, books or calls: a plumber, a hotel, a restaurant, an event, a rental. Six of the twelve researched cases need the same card: price, rating, a few badges, distance, and Call, Open or Directions. `show_products` is close but speaks shopping (merchant, availability, variants), and `show_results` has no price, rating or actions. One listing component covers all six cases with one schema.

## What Changes

- New render tool `show_listings` for 1 to 20 listings, each with a title and optional kind (stay, service, place, event, home), image, price with unit, rating and review count, badges, address, coordinates, distance, opening state, start time, phone and link.
- Cards in a responsive grid; sort by price, rating or distance without a new tool call.
- Actions on each card: "Open at site", "Call" and "Directions", each shown only when the data for it was passed.
- Shortlist: select listings and send them with "Ask about selected" or "Compare selected".
- A grid and map toggle when two or more listings have coordinates, reusing the map component's tile layer and tile settings.
- A snapshot line under the grid with the source and the as-of time, telling the user to check the final price at the site.
- Guidance tells agents to use `show_listings` for places, services, stays and events, and `show_products` for goods bought from a store.

Out of scope: booking, quote requests sent by Inkview, cart, checkout and payments (actions only link out or dial); fetching listings, reviews, opening hours or coordinates (the agent passes what it has); live availability or price refresh; photo galleries; `show_auto` routing to listings (a later `show_auto` update, as was done for the v2 components).

## Capabilities

### New Capabilities
- `listings`: Shows places, services, stays, events and homes as cards with price, rating and contact actions, with an optional map, via `show_listings`.

### Modified Capabilities

None.

## Impact

- New folder `src/components/listings/`; the map tile layer in `src/components/map/` is shared rather than copied.
- `src/guidance` gains a situation line and a line separating listings from products; the plugin Skill and ChatGPT doc are regenerated.
- Shared bundle grows; it must stay inside the 100 KB gzipped budget.
- README component list and gallery get a listings entry with consumer sample prompts (plumber, hotel, weekend events).

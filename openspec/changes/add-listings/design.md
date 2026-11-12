# Design

## Context

Agents get consumer listing data from web search, brand apps or a places API, so fields are often missing: a tradesperson has a phone but no website, a hotel has a price but no coordinates. The card must look complete with any subset. See proposal.md for scope.

## Goals / Non-Goals

**Goals:**
- One schema that reads naturally for stays, services, places, events and homes.
- Every field except `title` optional, with no empty slots on the card.
- Reuse the map tile layer; add no map code of its own.

**Non-Goals:**
- Replacing `show_products`. Goods bought from a store keep their own tool.
- Per-kind layouts. Kind changes labels, not structure.

## Decisions

**One tool with a `kind` hint, not `show_stays`, `show_services` and `show_events`.** Agents choose more reliably among fewer tools, and the cards differ only in labels. `kind` is optional and may be set once for the whole call or per listing. It changes wording only: the price unit default (stay: "per night"), the open-link label ("Book at site" for stay and event, "Visit website" for service and place, "View listing" for home) and the placeholder icon. Alternative considered: extending `show_products` with place fields; rejected because its required `url`, "View at store" wording and availability states do not fit a plumber or an event.

**Price is an object.** `price` holds `amount`, `currency`, optional `unit` (night, person, hour, week, month, total) and optional `from` (true shows "from"). A free-text `priceNote` (max 60 characters) carries things like "call-out fee" or "free cancellation". Sorting uses `amount` only when all priced listings share a currency and unit; otherwise price sort is not offered. This avoids ranking a per-night price against a total.

**Distance is passed, never computed from the user's location.** Hosts do not give the app the user's location. The agent passes `distanceKm` per listing and one `distanceFrom` label for the call ("from Parramatta station"). The view formats kilometres or miles by locale.

**Opening state is passed as data with a time stamp.** `openNow` (boolean) is only true at the moment the agent looked it up, so it is shown with the as-of time and hidden when `asOf` is more than 3 hours old. `hours` is a short free-text line shown as is.

**Call uses a `tel:` link through the host, with the number always visible.** Some hosts refuse non-http links. The number is printed on the card and has a copy button, so the action degrades to copy. The schema accepts `phone` as a string of digits, spaces and `+ - ( )` and rejects anything else, so a link cannot be smuggled in.

**Directions is a maps search URL**, built the same way as the map component's "Open in maps": coordinates when present, otherwise the address. Shown only when one of the two exists.

**Map toggle reuses the map view.** With two or more listings holding coordinates, a toggle swaps the grid for the map tile layer with one pin per listing and the selected card beside it. Listings without coordinates stay in the grid view only, with a count shown in map view ("3 not on map"). Tile settings and the neutral-grid fallback come from the map component unchanged.

**Badges are plain strings, max 4 per listing, max 24 characters.** Examples: "Licensed", "Free cancellation", "Family friendly". The tool description tells the agent to pass only badges its source states, because a wrong "Licensed" badge is harmful.

**Snapshot line.** `asOf` (ISO date-time) and `source` render as "Prices and details from <source>, checked <time>. Check the final price at the site." It shows whenever any listing has a price.

## Risks / Trade-offs

- [Agents invent ratings, badges or phone numbers] → Tool description and guidance repeat "pass only what your source gave"; eval prompts include a case with sparse data.
- [Overlap with `show_products` confuses tool choice] → One guidance line each way and four eval prompts on the boundary (a hotel, a plumber, a vacuum cleaner, concert tickets).
- [Stale prices mislead] → The snapshot line; no price is shown without it.
- [Bundle budget] → Shares map and card styles; the size check in CI guards it.

## Open Questions

- Cap of 20 listings: enough for a map of hotels? The SDK can raise caps for self-hosters, as it does for map places.

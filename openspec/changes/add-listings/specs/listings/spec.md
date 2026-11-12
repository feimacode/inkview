# Spec Delta

## Purpose

Shows places, services, stays, events and homes as cards with price, rating and contact actions, with an optional map, so the user can shortlist and then act at the provider's own site, via the `show_listings` render tool.

## ADDED Requirements

### Requirement: Listings schema
`show_listings` SHALL take `listings` (1 to 20), each with `title` required and optional `id`, `kind` (stay, service, place, event or home), `imageUrl`, `price` (`amount`, `currency`, optional `unit` and `from`), `priceNote`, `rating` 0 to 5, `reviewCount`, `badges` (up to 4), `detail`, `address`, `lat` and `lng`, `distanceKm`, `openNow`, `hours`, `start`, `phone` and `url`; plus optional `title`, `kind`, `distanceFrom`, `asOf`, `caption` and `source`.

#### Scenario: Eight tradespeople
- **WHEN** the agent passes 8 listings of kind service with titles, ratings and phone numbers
- **THEN** the grid shows 8 cards

#### Scenario: Title only
- **WHEN** a listing has only a `title`
- **THEN** its card renders with the title and a placeholder, and no empty price, rating or action slots

#### Scenario: Unsafe phone value
- **WHEN** a listing's `phone` contains characters other than digits, spaces, `+`, `-`, `(` and `)`
- **THEN** the call is rejected with a validation error naming the field

### Requirement: Listing card display
Each card SHALL show the image or a placeholder, title, price formatted in its currency with its unit, rating with review count, badges, distance with the `distanceFrom` label, and address or start time when present; `kind` SHALL change labels only.

#### Scenario: Stay price
- **WHEN** a stay has price 210 AUD with unit night and `from` true
- **THEN** the card shows "from A$210 per night"

#### Scenario: Event start
- **WHEN** a listing of kind event has a `start` date-time
- **THEN** the card shows the start in a readable local format

### Requirement: Opening state freshness
`openNow` SHALL be shown only when `asOf` is present and no more than 3 hours old; `hours` SHALL be shown as passed.

#### Scenario: Stale opening state
- **WHEN** `openNow` is true and `asOf` is 2 days old
- **THEN** the card does not show "Open now"

### Requirement: Sort listings
The user SHALL be able to sort by rating, by distance and by price without a new tool call, with listings lacking the value placed last; price sort SHALL be offered only when all priced listings share one currency and unit.

#### Scenario: Sort by distance
- **WHEN** the user sorts by distance
- **THEN** cards reorder nearest first with listings without distance last

#### Scenario: Mixed price units
- **WHEN** some prices are per night and others are totals
- **THEN** sorting by price is not offered

### Requirement: Link, call and directions only
Each card SHALL offer "Open at site" when `url` is present, "Call" when `phone` is present and "Directions" when coordinates or an address are present, each through the host; the phone number SHALL be visible and copyable; the component SHALL NOT offer booking, quote, cart, checkout or payment actions of its own.

#### Scenario: Call a plumber
- **WHEN** the user clicks "Call" on a listing with a phone number
- **THEN** the host is asked to open a `tel:` link for that number

#### Scenario: Host refuses tel links
- **WHEN** the host cannot open a `tel:` link
- **THEN** the number remains visible with a working copy action

#### Scenario: No link passed
- **WHEN** a listing has no `url`
- **THEN** its card shows no "Open at site" action

### Requirement: Shortlist and ask
The user SHALL be able to select listings and send them to the agent with "Ask about selected", and with "Compare selected" when 2 to 5 are selected.

#### Scenario: Compare three hotels
- **WHEN** the user selects 3 listings and clicks "Compare selected"
- **THEN** a message naming the 3 listings and asking to compare them is sent into the chat

### Requirement: Map toggle
When 2 or more listings have coordinates, the user SHALL be able to switch between the grid and a map with one pin per listing, with selection kept across both; listings without coordinates SHALL be counted as not on the map; the map SHALL follow the map capability's tile configuration and fallback.

#### Scenario: Switch to map
- **WHEN** 6 of 8 listings have coordinates and the user switches to the map
- **THEN** the map shows 6 pins and states that 2 listings are not on the map

#### Scenario: No coordinates
- **WHEN** fewer than 2 listings have coordinates
- **THEN** no map toggle is shown

### Requirement: Snapshot notice
When any listing has a price, the view SHALL show the source, the `asOf` time when present, and a note to check the final price at the site.

#### Scenario: Prices with as-of time
- **WHEN** listings have prices, a source named "Booking.com" and an `asOf` time
- **THEN** the view shows the source name, the checked time and the check-at-site note

### Requirement: Listings markdown fallback
The text result SHALL list each listing with its title (linked when `url` is present), price with unit, rating, distance, address and phone, followed by the as-of time, caption and source.

#### Scenario: Text-only host
- **WHEN** Claude Code calls `show_listings`
- **THEN** the user sees a markdown list of the listings with links and phone numbers

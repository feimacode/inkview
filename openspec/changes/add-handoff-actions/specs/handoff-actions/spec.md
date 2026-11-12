# Spec Delta

## Purpose

Defines the actions that take a user from an Inkview card to the business itself, so every card ends in a safe, consistent next step without Inkview booking or selling anything.

## ADDED Requirements

### Requirement: Actions derived from passed fields
A card SHALL show "Open at site" only when it has a `url`, "Call" only with a `phone`, "Directions" only with coordinates or an `address`, "Add to calendar" only with a `start` and a host that supports file downloads, and "Copy" only for a phone, address or link it has; it SHALL never show an action without its field.

#### Scenario: Entity card with phone and address
- **WHEN** `show_entity_card` gets a `phone`, an `address` and a `websiteUrl`
- **THEN** the card offers Open website, Call and Directions

#### Scenario: Event without download support
- **WHEN** a listing of kind event has a `start` and the host does not support file downloads
- **THEN** "Add to calendar" is not shown

### Requirement: Actions go through the host
Open, Call and Directions SHALL open their link through the host's open-link request, and "Add to calendar" SHALL use the host's file download with a valid .ics file named after the item.

#### Scenario: Add a concert to the calendar
- **WHEN** the user clicks "Add to calendar" on an event listing starting 2026-12-05T19:30
- **THEN** the host is asked to download an .ics file whose event starts at that time

### Requirement: Copy fallback
Copy SHALL put the value on the clipboard and confirm with a short message; when the clipboard is unavailable, it SHALL select the visible value so the user can copy it by hand.

#### Scenario: Clipboard blocked in the frame
- **WHEN** the clipboard API is not available
- **THEN** clicking Copy selects the phone number text on the card

### Requirement: Action order and overflow
The primary action (Open at site when present, otherwise Call) SHALL come first, at most 3 actions SHALL show as buttons, and further actions SHALL sit under a "More" menu reachable by keyboard.

#### Scenario: Five actions at phone width
- **WHEN** a listing has url, phone, address, start and the frame is 320 px wide
- **THEN** Open at site, Call and Directions show as buttons and the rest are under "More"

### Requirement: Safe link schemes
URL fields in every component schema SHALL accept only `https` and `http` URLs, and the runtime SHALL refuse to open any link whose scheme is not `https`, `http`, `tel` or `mailto`.

#### Scenario: Script URL in a listing
- **WHEN** a listing's `url` is `javascript:alert(1)`
- **THEN** the call is rejected with a validation error naming `url`

#### Scenario: Unsafe link reaches the runtime
- **WHEN** any view asks to open a `data:` URL
- **THEN** no open-link request is sent to the host

### Requirement: No transactional actions
No component SHALL offer booking, quote, reservation, cart, checkout or payment actions of its own.

#### Scenario: Hotel listing
- **WHEN** a stay listing has a `url`
- **THEN** its action reads "Open at site", not "Book"

### Requirement: Actions in the markdown fallback
Markdown fallbacks SHALL list each available action as a link: the site link, a `tel:` link with the number shown, and a map link for directions.

#### Scenario: Text-only host
- **WHEN** a text-only host receives an entity card with phone and address
- **THEN** the markdown shows the phone as a `tel:` link and a "Directions" map link

# Proposal

## Why

The agreed direction makes every Inkview card end in a real hand-off to the business: open the site, call, get directions, add to calendar. Listings already offers Open at site, Call, Directions and a copyable phone number, and the itinerary offers an .ics download. But each component builds its own buttons, entity cards can't call or give directions, and product and result cards can't copy a link. There's also a safety gap: URL fields use `z.string().url()`, which accepts `javascript:` and `data:` URLs (checked with zod 4), and `openLink` passes any URL to the host.

## What Changes

- One shared hand-off action set, built only from fields the agent passed:
  - **Open at site** from `url`
  - **Call** from `phone` (as `tel:`)
  - **Directions** from coordinates or `address`
  - **Add to calendar** (.ics download) from `start`, only when the host supports file downloads
  - **Copy** for phone, address and link
- A shared rule for order and space: the primary action first, at most 3 buttons in a row, and the rest under "More" at narrow widths.
- Link safety: every URL field accepts only `https` and `http`, and `openLink` refuses any scheme other than `https`, `http`, `tel` and `mailto`. **BREAKING** for any caller passing other schemes, which no legitimate caller should.
- Components that gain actions:
  - Entity card: optional `phone` and `address`, giving Call, Directions and Copy.
  - Product grid and result list: Copy link.
  - Listings: Add to calendar for events, and Copy address.
  - Comparison: Open at site for options with a `url`.
  - Itinerary: Directions for stops with an address.
- Listings and itinerary move their existing buttons onto the shared set, with no change in behaviour.
- Markdown fallbacks list the same actions as links (`tel:`, map link, site link).

Out of scope:
- Booking, quotes, cart, checkout and payment (project rule).
- A native share sheet. MCP Apps hosts have no share API and the frame is sandboxed, so "Copy link" covers sharing.
- Link risk levels (later change on top of the provenance footer).
- Saving or shortlisting across turns.

## Capabilities

### New Capabilities
- `handoff-actions`: The shared set of actions that take the user from a card to the business, how they are derived from data, ordered, made safe and shown in text-only hosts.

### Modified Capabilities
- `component-runtime`: link opening gains a scheme allowlist.

## Impact

- New `src/runtime/actions.tsx` (action derivation, `Actions` row with "More" overflow, clipboard helper). `mapsUrl` moves from `map/project.ts` to it, and `toIcs` moves from `itinerary/format.ts` to a shared module.
- `src/runtime/app.tsx` `openLink` gains the scheme check. A shared `httpUrl` schema replaces `z.string().url()` in all component schemas.
- Schema, view, markdown fallback, examples and tests change for entity card, product grid, result list, listings, comparison and itinerary.
- Guidance text and generated docs, plus SDK re-exports.

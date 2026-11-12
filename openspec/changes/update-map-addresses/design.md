# Design

## Context

The map schema requires `lat` and `lng` and its error says "Inkview does not look up addresses". That protects the no-fetch rule but makes mixed data unusable. See proposal.md for scope.

## Goals / Non-Goals

**Goals:**
- A call with partial coordinates renders what it can.
- No outbound requests beyond the tiles already declared.

**Non-Goals:**
- Geocoding in this change.

## Decisions

**Address-only places are listed, not pinned.** `lat` and `lng` become optional as a pair; a place needs both coordinates or an `address`. Places without coordinates sit at the end of the list with a "Not on map" tag. Selecting one shows its detail without moving the map. "Open in maps" uses the address as the search query. The map fits only the pinned places.

**List-only layout when nothing can be pinned.** The tile layer is not loaded, so no tile request is made, and a one-line notice says the places have no coordinates.

**Half a coordinate is an error.** A place with `lat` but no `lng` (or the reverse) is rejected with a message naming the missing field, because it is almost always a mistake.

**No geocoding now; record the path for later.** Alternatives considered:
1. Geocode on the hosted server with OpenStreetMap Nominatim. Best result for the user, but it breaks two standing rules (never fetch on the user's behalf; hosted server makes no outbound data calls), sends place addresses to a third party, and the public Nominatim service allows about 1 request per second and forbids heavy app use, which a free hosted server cannot promise.
2. Geocode in the view (browser calls a geocoder). Same third-party exposure, plus a new CSP `connectDomains` entry and a key visible to users.
3. Leave it to the agent. Agents with a places or search tool usually can get coordinates; the tool description asks for them.
Decision: 3 for this change. If Iven wants 1 later, it should be its own change: opt-in by server config (off by default for self-hosters), a cap per call, a cache of nothing (the hosted build is stateless), and a privacy page update.

**`pinLabel` is text on the pin, max 8 characters.** Longer values are rejected so pins do not overlap into noise. With a label the pin becomes a pill; without one it stays a dot. The label is not sent in tile requests.

## Risks / Trade-offs

- [Users expect every listed place on the map] → The "Not on map" tag and a count above the list ("5 of 8 on map").
- [Agents stop sending coordinates because addresses now pass] → The description says coordinates first; an eval prompt checks a places-API case still sends them.
- [Callers that used the rejection as a signal] → Noted as breaking in the proposal; the SDK changelog calls it out.

## Open Questions

- Does Iven want the opt-in geocoding change (alternative 1) proposed next?

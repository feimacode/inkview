# Proposal

## Why

Today the agent shows several people by calling `show_profile_card` once per person, up to 5. That is slow (one tool call each), wastes space, and gives no way to pick a few of them at once. Searches for candidates, speakers or attendees routinely return 10 or more people. The profile grid is the planned v2 answer and the shortlist view that `update-profile-card-actions` deferred.

## What Changes

- New render tool `show_profiles` for 2 to 24 people as compact cards in a responsive grid, using the same person fields as the profile card.
- Select several people and either "Ask about selected" (a chat message) or "Add to shortlist" (model context, same as the profile card).
- A shortlist bar shows who is on the shortlist in this view, with remove.
- The profile card description changes to point the model at `show_profiles` for more than one person.

Out of scope: saving shortlists outside the conversation, pagination past 24 people, deduplicating people across calls.

## Capabilities

### New Capabilities
- `profile-grid`: Shows many people as a grid of compact cards with multi-select, via `show_profiles`.

### Modified Capabilities
- `profile-card`: Its tool guidance sends several people to `show_profiles` instead of repeated calls.

## Impact

- New folder `src/components/profile-grid/`; it reuses the profile card's person schema and avatar fallback rather than duplicating them.
- `src/components/profile-card/meta.ts` description change, so guidance and eval prompts for "several people" change too.

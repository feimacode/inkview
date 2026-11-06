# Proposal

## Why

The plan lists "add to list" as a profile card action, and the pilot left it out. When users review several people, they want to shortlist some without sending a message for each one.

## What Changes

- "Add to shortlist" on the profile card records the person in the conversation's model context (not as a chat message), so the agent can use the shortlist later.
- The button shows its state and can undo.

Out of scope: storing shortlists anywhere outside the conversation; a shortlist view (comes with the profile grid in v2).

## Capabilities

### New Capabilities

### Modified Capabilities
- `profile-card`: Adds an "Add to shortlist" action; existing actions are unchanged.

## Impact

- `src/components/profile-card/` view only; no schema change.
- Depends on `add-component-runtime`.

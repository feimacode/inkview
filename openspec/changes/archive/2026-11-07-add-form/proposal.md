# Proposal

## Why

When an agent needs several inputs before it can act (trip dates and budget, a support request's details, filters for a search), it asks one question at a time or a long list the user answers in prose. The plan's v2 form lets the agent ask for the missing inputs at once, with the right controls and validation, and get a clean answer back.

## What Changes

- New render tool `show_form` with typed fields: text, long text, number, date, select (single or multiple), checkbox, email and URL.
- Labels, help text, required fields, defaults, min and max, and options for selects.
- Validation in the view before submit; "Submit" sends the answers to the agent as one message; "Cancel" tells the agent the user declined.
- Up to 12 fields; markdown fallback lists the questions so text-only users can answer in chat.

Out of scope: passwords, payment cards, government IDs and other secrets (rejected by the schema, since the answers go into the chat transcript), file uploads, multi-page wizards, conditional fields, saving answers anywhere.

## Capabilities

### New Capabilities
- `form`: Asks the user for structured inputs and sends the answers back to the agent, via `show_form`.

### Modified Capabilities

## Impact

- New folder `src/components/form/`.
- Guidance must say to use the form only when 3 or more inputs are missing, so it doesn't replace simple questions.

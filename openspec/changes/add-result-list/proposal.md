# Proposal

## Why

Web and document search results are the second most common thing agents show. A ranked list with titles, sources and snippets is easier to scan than prose, and lets the user open or dig into a result in one click.

## What Changes

- New render tool `show_results` for ranked results with title, URL, snippet, source name, favicon, date and optional score.
- Actions: open a result, and "dig deeper" which asks the agent to research that result.
- Up to 20 results.
- Markdown fallback as a numbered list of links with snippets.

Out of scope: running searches (the agent does that), pinning or saving results across chats.

## Capabilities

### New Capabilities
- `result-list`: Shows ranked search or document results with snippets and per-result actions via `show_results`.

### Modified Capabilities

## Impact

- New folder `src/components/result-list/` registered in the component registry; new examples in the preview gallery.
- Depends on `add-component-runtime`.

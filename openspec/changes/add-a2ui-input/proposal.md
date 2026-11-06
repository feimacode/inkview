# Proposal

## Why

Google's A2UI is a declarative JSON format for agent-generated UI, rendered by the host from a component catalog. Agents and frameworks are starting to emit it, but Claude and ChatGPT don't render it natively. The plan's angle is to accept A2UI as an input format and render it inside Inkview's MCP App, so A2UI output works in hosts with no A2UI support, with Inkview's theming.

## What Changes

- A spike to confirm the current A2UI version, message shape and standard catalog, and record the mapping in design.md before any code.
- New render tool `show_a2ui` that takes one A2UI surface (components and data model) and renders it with Inkview primitives: layout (row, column, list, card, tabs, divider), content (text, heading, image, icon) and inputs (button, text field, checkbox, choice, date).
- A2UI actions (button presses, input changes) are sent back to the agent as a chat message naming the action and the current input values.
- Components outside the supported catalog render as a labelled placeholder with their text content, never as raw JSON.
- Markdown fallback that walks the surface and prints its text in reading order.

Out of scope: streaming incremental surface updates across several tool calls (one call renders one complete surface), custom catalogs, A2UI output from Inkview components, any A2UI transport other than the tool input.

## Capabilities

### New Capabilities
- `a2ui-input`: Renders A2UI surfaces as an Inkview MCP App and returns A2UI actions to the agent, via `show_a2ui`.

### Modified Capabilities

## Impact

- New folder `src/components/a2ui/` with a catalog mapping onto `src/runtime/primitives.tsx`.
- A2UI is pre-1.0 and changing; the supported version is pinned and named in the tool description.
- Priority: lowest of the post-MVP changes; revisit after the spike shows real demand.

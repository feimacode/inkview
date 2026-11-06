# Spec Delta

## Purpose

Renders an A2UI surface in the chat with Inkview's theming and returns its actions to the agent, via the `show_a2ui` render tool.

## ADDED Requirements

### Requirement: A2UI surface input
`show_a2ui` SHALL take one complete A2UI surface in the pinned A2UI version (component definitions, root, and data model), at most 100 KB of JSON and 200 components, and SHALL reject input that does not parse as that version.

#### Scenario: Valid surface
- **WHEN** the agent passes a surface with a card holding a heading, text and a button
- **THEN** the view renders a card with that heading, text and button

#### Scenario: Wrong version or shape
- **WHEN** the input is not a valid surface in the pinned version
- **THEN** the call is rejected with an error naming the supported version

### Requirement: Standard catalog rendering
The view SHALL render the supported A2UI standard catalog components with Inkview primitives and host theme tokens, and SHALL resolve data bindings from the surface's data model.

#### Scenario: Data binding
- **WHEN** a text component is bound to a data model path holding "Order shipped"
- **THEN** the text shows "Order shipped"

### Requirement: Unsupported components
A component outside the supported catalog SHALL render as a labelled placeholder showing its text content, and SHALL NOT render raw JSON or break the rest of the surface.

#### Scenario: Unknown component
- **WHEN** the surface contains a "VideoPlayer" component
- **THEN** a placeholder labelled "Unsupported: VideoPlayer" shows in its place and the rest renders

### Requirement: Actions back to the agent
A2UI actions SHALL be sent to the agent as a chat message naming the action and including the current values of the surface's inputs.

#### Scenario: Button press
- **WHEN** the user fills a text field and presses a button with action "submit_feedback"
- **THEN** a message naming "submit_feedback" and the field's value is sent into the chat

### Requirement: A2UI markdown fallback
The text result SHALL list the surface's text content in reading order, with buttons shown as their labels in brackets.

#### Scenario: Text-only host
- **WHEN** Claude Code calls `show_a2ui`
- **THEN** the user sees the surface's text in order

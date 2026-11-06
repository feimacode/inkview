# Spec Delta

## Purpose

Defines the shared behavior of every Inkview view inside an MCP Apps host: choosing the component to draw, theming, sizing, accessibility and the states around a tool call.

## ADDED Requirements

### Requirement: Component selection
The view SHALL render the component named in the tool result's `structuredContent.component`, and SHALL show the result's text content when it does not know that component.

#### Scenario: Known component
- **WHEN** a tool result names `profile_card`
- **THEN** the view renders the profile card from the result data

#### Scenario: Unknown component
- **WHEN** a tool result names a component this bundle does not include
- **THEN** the view shows the result's markdown text instead of failing

### Requirement: Early render from tool input
The view SHALL render from the tool's input arguments as soon as the host sends them, and SHALL replace that render with the validated result when it arrives.

#### Scenario: Input arrives before the result
- **WHEN** the host sends tool input and the result is still pending
- **THEN** the component is drawn from the input

### Requirement: Call states
The view SHALL show a loading placeholder until data arrives, a short message when the host cancels the call, and a readable error when it cannot connect to the host.

#### Scenario: Cancelled call
- **WHEN** the host cancels the tool call before any data arrives
- **THEN** the view shows "Cancelled"

### Requirement: Host theming
The view SHALL apply the host's style variables, fonts and light or dark theme, and SHALL fall back to Inkview's own tokens for any variable the host does not send.

#### Scenario: Host sends no variables
- **WHEN** the host provides no style variables
- **THEN** the view uses Inkview defaults that match the system color scheme

#### Scenario: Dark theme
- **WHEN** the host reports a dark theme
- **THEN** text and controls meet WCAG AA contrast against the dark background

### Requirement: Content sizing
The view SHALL report its content height to the host so that the frame fits the component without inner scrollbars, and SHALL fit widths down to 320 px without horizontal scrolling.

#### Scenario: Phone width
- **WHEN** the frame is 320 px wide
- **THEN** the component reflows with no horizontal scrollbar

### Requirement: Accessible actions
Every action in a component SHALL be reachable by keyboard and SHALL show a visible focus indicator.

#### Scenario: Keyboard user
- **WHEN** the user tabs through a rendered component
- **THEN** each action receives focus in reading order with a visible focus ring

### Requirement: Bundle size budget
The shared view bundle SHALL stay at or under 100 KB gzipped.

#### Scenario: Build exceeds the budget
- **WHEN** a build produces a bundle over 100 KB gzipped
- **THEN** the test suite fails and names the size

### Requirement: Component preview gallery
The project SHALL provide a command that renders every registered component's examples in light and dark themes without any agent host.

#### Scenario: Developer previews components
- **WHEN** a developer runs the preview command
- **THEN** a local page shows each component example in both themes

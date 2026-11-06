# Spec Delta

## Purpose

Defines what Inkview ships for each host so that models choose and fill the right component without the user naming it.

## ADDED Requirements

### Requirement: Server instructions
The server SHALL return instructions on initialize that list each component with when to use it, and that tell the model to pass only data it already has.

#### Scenario: Host initializes
- **WHEN** a host sends `initialize`
- **THEN** the response includes instructions naming every render tool

### Requirement: Claude plugin
The project SHALL ship a Claude plugin that installs the Inkview MCP server and a Skill describing when to use each component, installable in Claude Desktop and Claude Code.

#### Scenario: Install the plugin
- **WHEN** a user installs the Inkview plugin in Claude Desktop
- **THEN** Inkview's tools and the Skill are available in new chats without editing config files

### Requirement: Skill content
The Skill SHALL map common situations to components (one person, several records, search results, a company, options to choose, numbers, products) and SHALL tell the model to add at most one sentence after rendering.

#### Scenario: People search
- **WHEN** a user asks Claude with the plugin to find a specific person
- **THEN** Claude calls `show_profile_card` without being asked to

### Requirement: ChatGPT app configuration
The project SHALL document a ChatGPT developer-mode app configuration (name, description, icon, instructions) that works with the hosted server and is ready for app directory submission.

#### Scenario: Create the ChatGPT app
- **WHEN** a user follows the documented configuration in ChatGPT developer mode
- **THEN** the app appears with the Inkview name and icon and renders components

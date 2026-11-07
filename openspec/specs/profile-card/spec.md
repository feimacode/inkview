# profile-card Specification

## Purpose

Shows one person as an interactive card in the chat, from data the agent already gathered, via the `show_profile_card` render tool.

## Requirements

### Requirement: Profile card schema
`show_profile_card` SHALL take `name` (required) and optional `headline`, `avatarUrl`, `company`, `location`, `about`, `highlights` (up to 6), `tags` (up to 10), `links` (up to 6, label and URL), `profileUrl` and `source` (name and optional URL).

#### Scenario: Minimal card
- **WHEN** the agent passes only `name`
- **THEN** the card renders with the name and an initials avatar

#### Scenario: Too many highlights
- **WHEN** the agent passes more than 6 highlights
- **THEN** the call is rejected with a validation error

### Requirement: Tool guidance for the model
The tool description SHALL tell the model to use the card for a single person, to use `show_profiles` instead when showing two or more people, to pass only data it gathered, and never to invent a photo URL or links.

#### Scenario: Model reads the tool list
- **WHEN** a host lists the tool
- **THEN** its description states when to use it and that fields must not be invented

#### Scenario: Several people
- **WHEN** a host lists the tool
- **THEN** its description names `show_profiles` for two or more people

### Requirement: Avatar fallback
The card SHALL show the person's initials when no avatar URL is given, when the image fails to load, or when its domain is not allowed by the resource's content security policy.

#### Scenario: Image from an undeclared domain
- **WHEN** `avatarUrl` points to a domain not in the CSP list
- **THEN** the card shows initials instead of a broken image

### Requirement: Card actions
The card SHALL offer "Open profile" when `profileUrl` is set, opening it through the host; "Draft outreach" and "Dig deeper" SHALL send a follow-up user message to the conversation.

#### Scenario: Open profile
- **WHEN** the user clicks "Open profile"
- **THEN** the host is asked to open `profileUrl`

#### Scenario: Draft outreach
- **WHEN** the user clicks "Draft outreach"
- **THEN** a message asking the agent to draft outreach to that person is sent into the chat

### Requirement: Host theming
The card SHALL follow the host's theme variables and light or dark mode, with Inkview's own defaults when the host sends none.

#### Scenario: Dark mode host
- **WHEN** the host is in dark mode
- **THEN** the card renders with dark backgrounds and readable text

### Requirement: Markdown fallback
The text result SHALL contain the name as a heading, then headline, company and location, about, highlights as a list, tags, links and source, omitting fields that are absent.

#### Scenario: Claude Code renders the result
- **WHEN** the tool is called from Claude Code
- **THEN** the user sees the profile as markdown with the person's name as a heading

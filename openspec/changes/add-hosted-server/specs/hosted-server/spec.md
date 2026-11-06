# Spec Delta

## Purpose

Defines the free public deployment of Inkview that Claude, ChatGPT and other hosts connect to over HTTPS.

## ADDED Requirements

### Requirement: Public endpoint without sign-in
The hosted server SHALL serve MCP over streamable HTTP at a stable HTTPS URL ending in `/mcp`, and SHALL accept connections without authentication.

#### Scenario: Add as a Claude connector
- **WHEN** a user adds the hosted URL as a custom connector with "No sign in"
- **THEN** Claude lists the Inkview tools and renders a profile card

#### Scenario: Add as a ChatGPT app
- **WHEN** a user creates a developer-mode app with the hosted URL and no authentication
- **THEN** ChatGPT lists the Inkview tools and renders a profile card

### Requirement: No data retention
The hosted server SHALL NOT store tool arguments or results and SHALL NOT write them to logs, traces or error reports.

#### Scenario: Log review
- **WHEN** an operator reads the hosted logs after a profile card call
- **THEN** the logs hold method name, status and timing only, with no field values

### Requirement: No outbound fetching
The hosted server SHALL NOT fetch URLs found in tool input, including images.

#### Scenario: Avatar URL in input
- **WHEN** a call includes an `avatarUrl`
- **THEN** the server makes no request to that URL

### Requirement: Abuse limits
The hosted server SHALL reject request bodies over 256 KB and SHALL rate-limit each client IP, answering excess requests with HTTP 429.

#### Scenario: Oversized request
- **WHEN** a client posts a 1 MB body
- **THEN** the server answers HTTP 413 without processing it

#### Scenario: Request burst
- **WHEN** one IP exceeds the rate limit
- **THEN** further requests get HTTP 429 until the window resets

### Requirement: Health and availability
The hosted server SHALL expose `/healthz` and SHALL target 99.5% monthly availability, measured by an external check.

#### Scenario: Health check
- **WHEN** a monitor requests `/healthz`
- **THEN** it gets HTTP 200 with the running version

### Requirement: Published privacy statement
A public page SHALL state what the hosted server receives, that it stores and logs no tool data, and how to self-host instead.

#### Scenario: Directory review
- **WHEN** a directory reviewer asks for the privacy policy
- **THEN** a stable URL with that statement is available

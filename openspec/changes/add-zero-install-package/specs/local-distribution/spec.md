# Spec Delta

## Purpose

Defines how end users get Inkview running locally: the npm package, start-up behavior, desktop extension and supported platforms.

## ADDED Requirements

### Requirement: Dependency-free package
The published npm package SHALL have no runtime dependencies, so that `npx` downloads a single package.

#### Scenario: Inspecting the package
- **WHEN** a user runs `npm view @feimacode/inkview dependencies`
- **THEN** the result is empty

### Requirement: Fast first start
On a machine with an empty npm cache and a normal connection, `npx -y @feimacode/inkview --version` SHALL finish within 15 seconds, and the server SHALL answer `initialize` within 1 second of starting once installed.

#### Scenario: Cold start from an MCP client
- **WHEN** Claude Desktop starts `npx -y @feimacode/inkview` for the first time
- **THEN** the server answers `initialize` well inside the client's start-up limit

### Requirement: Platform support
The package SHALL run on Linux (including WSL), macOS and Windows with Node 20 or newer.

#### Scenario: WSL user
- **WHEN** a user runs the package under WSL with Node 20+
- **THEN** it starts and answers over stdio

### Requirement: Version and help flags
`inkview --version` SHALL print the version and exit, and `inkview --help` SHALL print usage and exit, without starting a server.

#### Scenario: Version check
- **WHEN** a user runs `inkview --version`
- **THEN** the version prints and the process exits with code 0

### Requirement: Desktop extension
Each release SHALL include a `.mcpb` desktop extension that installs Inkview in Claude Desktop without a terminal.

#### Scenario: One-click install
- **WHEN** a user opens the `.mcpb` file with Claude Desktop
- **THEN** Inkview is added and its tools appear in a new chat

# Spec Delta

## MODIFIED Requirements

### Requirement: Render tools link a UI resource
Every render tool SHALL declare a `ui://` resource in its tool metadata (`_meta.ui.resourceUri`), and the server SHALL serve that resource with the MCP Apps HTML MIME type. All render tools of one schema major version SHALL share one resource, `ui://inkview/v1/app.html` for version 1.

#### Scenario: Host discovers the UI for a tool
- **WHEN** a client lists tools
- **THEN** each render tool carries a `ui://` resource URI
- **AND** reading that URI returns HTML with MIME type `text/html;profile=mcp-app`

#### Scenario: Two components share the bundle
- **WHEN** a client lists `show_profile_card` and another v1 render tool
- **THEN** both point to `ui://inkview/v1/app.html`

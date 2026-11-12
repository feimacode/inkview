# Spec Delta

## ADDED Requirements

### Requirement: Link opening allowlist
The view SHALL send an open-link request to the host only for `https`, `http`, `tel` and `mailto` links, and SHALL NOT fall back to opening a window for any other scheme.

#### Scenario: Host open-link fails for an https link
- **WHEN** the host rejects an open-link request for an `https` link
- **THEN** the view falls back to opening it in a new window with `noopener`

#### Scenario: javascript link
- **WHEN** a view asks to open a `javascript:` link
- **THEN** neither the host request nor the window fallback happens

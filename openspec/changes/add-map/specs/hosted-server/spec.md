# Spec Delta

## ADDED Requirements

### Requirement: Privacy page names the map tile provider
When map tiles are enabled, the hosted privacy page SHALL name the tile provider and state that the user's chat app requests tiles for the area shown directly from that provider.

#### Scenario: Tiles enabled on the hosted server
- **WHEN** the hosted server runs with a tile provider configured
- **THEN** the privacy page names that provider and what it receives

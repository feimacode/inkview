# Spec Delta

## MODIFIED Requirements

### Requirement: Tool guidance for the model
The tool description SHALL tell the model to use the card for a single person, to use `show_profiles` instead when showing two or more people, to pass only data it gathered, and never to invent a photo URL or links.

#### Scenario: Model reads the tool list
- **WHEN** a host lists the tool
- **THEN** its description states when to use it and that fields must not be invented

#### Scenario: Several people
- **WHEN** a host lists the tool
- **THEN** its description names `show_profiles` for two or more people

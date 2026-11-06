# Spec Delta

## ADDED Requirements

### Requirement: Add to shortlist
The card SHALL offer "Add to shortlist", which adds the person's name, headline and profile URL to the model context without sending a chat message, and SHALL let the user undo it.

#### Scenario: Shortlist a person
- **WHEN** the user clicks "Add to shortlist"
- **THEN** the person is added to the model context and the button shows "Shortlisted"

#### Scenario: Undo
- **WHEN** the user clicks "Shortlisted"
- **THEN** the person is removed from the model context and the button resets

#### Scenario: Host without model context
- **WHEN** the host does not support updating model context
- **THEN** the button is hidden

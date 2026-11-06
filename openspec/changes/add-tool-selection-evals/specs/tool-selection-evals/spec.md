# Spec Delta

## Purpose

Defines how Inkview measures whether models choose the right component and fill it correctly, and the bar a release must meet.

## ADDED Requirements

### Requirement: Eval coverage
The eval set SHALL contain at least 5 prompts per component and at least 8 prompts where the correct behavior is to answer without rendering.

#### Scenario: Counting prompts
- **WHEN** the eval set is loaded
- **THEN** every component has at least 5 prompts and the no-render group has at least 8

### Requirement: Scoring
Each run SHALL be scored on four checks: expected tool called (or none), input valid against the schema, no field values absent from the prompt's source data, and no render for no-render prompts.

#### Scenario: Invented avatar
- **WHEN** a model passes an `avatarUrl` that is not in the prompt's source data
- **THEN** that run fails the "no invented fields" check

### Requirement: Report
The runner SHALL output a per-component and overall score for each check, with the failing prompts listed.

#### Scenario: Release check
- **WHEN** a maintainer runs the evals
- **THEN** a report shows each component's pass rates and the failing prompts

### Requirement: Release bar
A release SHALL NOT ship unless the expected component is chosen in at least 85% of render prompts and invented-field failures stay under 5%.

#### Scenario: Below the bar
- **WHEN** the component choice rate is 80%
- **THEN** the release checklist marks the evals as failing

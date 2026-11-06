# Proposal

## Why

The MVP's success test is that an agent picks the right Inkview component unprompted and fills it correctly. Without a repeatable eval, tool descriptions and the Skill are tuned by feel, and regressions go unnoticed.

## What Changes

- An eval set of about 50 prompts across the 7 components, plus prompts where no component should be used.
- A runner that gives a Claude model the Inkview tools (and optionally the Skill) and scores each run: right tool, schema-valid input, no invented fields, no needless render.
- A report per component and an overall score, run on demand and before releases.
- Tool description tuning driven by the results, targeting at least 85% correct component choice.

Out of scope: evaluating ChatGPT models automatically (manual spot checks only for now), UI screenshot judging.

## Capabilities

### New Capabilities
- `tool-selection-evals`: The eval set, scoring rules and quality bar for how well models choose and fill Inkview components.

### Modified Capabilities

## Impact

- New `evals/` folder with prompts, fixtures and a runner using the Anthropic API; needs an API key in CI secrets for scheduled runs.
- Tool descriptions in every component may change as a result.

# Proposal

## Why

The model has to choose Inkview on its own, and in testing it often answers in prose instead. Tool descriptions alone are not enough; hosts let us ship instructions with the server: a Claude plugin with a Skill, and ChatGPT app instructions. These also make install a one-step affair.

## What Changes

- A Claude plugin bundling the Inkview MCP server and a Skill that says when to render (for example "after a people search, call `show_profile_card` for each person").
- ChatGPT app setup: name, description, icon, and app instructions for developer mode, ready for later directory submission.
- Server-level `instructions` returned on initialize, shared by all hosts.

Out of scope: directory submissions themselves (`prepare-public-launch`), Gemini and other hosts.

## Capabilities

### New Capabilities
- `host-integrations`: What Inkview ships for each host so the model picks the right component: server instructions, the Claude plugin and Skill, and the ChatGPT app configuration.

### Modified Capabilities

## Impact

- New `plugin/` folder (Claude plugin manifest, Skill) and `docs/chatgpt-app.md` with the app configuration.
- Server instructions text moves to one place used by every build.
- Depends on the component changes for the Skill's content; evals (`add-tool-selection-evals`) measure the effect.

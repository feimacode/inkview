# Tasks

## 1. Eval set

- [ ] 1.1 Write about 50 prompts with source data and expected tool (at least 5 per component, 8 no-render, 20% marked held-out); verify a loader test checks the counts

## 2. Runner and scoring

- [ ] 2.1 Build the runner reading tools from the built server and calling the Anthropic API, with tools-only and tools-plus-Skill modes; verify it runs end to end on 3 prompts
- [ ] 2.2 Implement the four checks and the report; verify unit tests with recorded model responses for each check
- [ ] 2.3 Add an `npm run evals` script and a manual GitHub Actions workflow; verify a run uploads the report

## 3. Tuning

- [ ] 3.1 Tune tool descriptions until component choice is at least 85% and invented fields under 5% on non-held-out prompts; verify with the report attached to the PR, including held-out scores

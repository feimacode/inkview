# Tasks

## 1. Detection

- [ ] 1.1 Implement shape detection rules in order with field-name heuristics per component; verify unit tests with at least 3 fixtures per component plus a no-match fixture
- [ ] 1.2 Map detected data into the chosen component's schema and apply its limits; verify mapped output passes that component's schema
- [ ] 1.3 Add the `hint` override; verify unit tests where a hint changes the choice

## 2. Tool

- [ ] 2.1 Register `show_auto` with a description that prefers explicit tools when the component is clear; verify the smoke test calls it with table, profile and no-match data
- [ ] 2.2 Return the chosen tool name plus the component's markdown fallback; verify the text result names the tool
- [ ] 2.3 Add a formatted-text view for the no-match case; verify a render test

## 3. Docs

- [ ] 3.1 Document detection rules in the README; verify examples in the docs match unit test fixtures

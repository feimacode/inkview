# Tasks

## 1. Guidance source

- [x] 1.1 Create `src/guidance/` with per-component "use when" text and a generator for server instructions; verify the smoke test checks initialize instructions name every tool

## 2. Claude plugin

- [ ] 2.1 Add `plugin/` with the plugin manifest pointing at `npx -y @feimacode/inkview` and a generated Skill; verify install in Claude Code with `/plugin` and in Claude Desktop
- [ ] 2.2 Run the people, table and product prompts from the eval set with and without the Skill; verify the Skill raises the tool-pick rate and record numbers in the PR

## 3. ChatGPT app

- [ ] 3.1 Write `docs/chatgpt-app.md` with name, description, icon and generated instructions; verify by creating the app in developer mode against the hosted server

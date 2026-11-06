# Design

## Context

Model choice is the main product risk named in the plan ("the model skips the render tool"). This change ships guidance; `add-tool-selection-evals` measures it.

## Goals / Non-Goals

**Goals:**
- One source text for guidance, reused in server instructions, the Skill and the ChatGPT app instructions.

**Non-Goals:**
- Host-specific UI code; the view stays on the MCP Apps standard.

## Decisions

**Single guidance source in `src/guidance/`.** A generator writes the server instructions string, the Skill's `SKILL.md` body and the ChatGPT instructions, so they never drift. Alternative: hand-maintained copies, rejected for drift.

**Plugin bundles the local stdio server.** Claude Code and Desktop users get the local build (data stays on the machine); a hosted variant of the plugin pointing at the remote URL can follow if users ask.

**Skill stays short.** Under 60 lines: a situation-to-tool table plus three rules (do not invent fields, one sentence after rendering, prefer explicit tools over `show_auto`).

## Risks / Trade-offs

- [Skill makes the model render too eagerly] → Evals include prompts where plain text is the right answer.
- [Plugin format changes] → Keep the plugin thin; the server is the product.

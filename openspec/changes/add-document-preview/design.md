# Design

## Context

The first component that renders user-visible rich text from model input, so it is the first one with an injection surface. See proposal.md for scope.

## Goals / Non-Goals

**Goals:**
- No way for model input to run script or load content outside the CSP.
- Fit within the shared 100 KB gzipped bundle.

**Non-Goals:**
- Full CommonMark compliance; the supported subset is enough for drafts.

## Decisions

**A small in-house markdown renderer that builds React elements, not HTML strings.** It covers headings, paragraphs, emphasis, inline code, code blocks, lists, links, blockquotes and pipe tables. Because it never calls `dangerouslySetInnerHTML`, raw HTML in the body shows as text. Alternatives: `marked` plus a sanitizer (about 15 KB gzipped together and a sanitizer to keep current), `micromark` (correct but larger). Revisit if the subset proves too small.

**Links open through the host's `openLink`**, so the host shows its own confirmation. Images in markdown are shown as their alt text and link, not loaded, because the CSP limits image domains anyway and drafts rarely need them.

**Approve sends the full text as a user message**, prefixed with "Approved:" and the title. The model then acts with its own tools. Edits are kept in view state until approval; nothing is stored.

**Body cap of 20,000 characters.** Longer documents are slow to re-type as arguments and better handled as files.

## Risks / Trade-offs

- [Model treats "Approved" as permission to send without the user's intent] → The guidance says to confirm the destination before sending and the message names the action ("Approved: send this email"), but the host's own tool confirmation remains the real control.
- [Clipboard blocked in sandboxed iframes] → Feature-detect, hide on failure; Edit mode still allows manual select-all and copy.

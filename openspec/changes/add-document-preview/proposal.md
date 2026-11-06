# Proposal

## Why

Agents draft emails, posts, cover letters, contract clauses and reports. In chat these arrive as a wall of markdown mixed with commentary, and the user's edits go back as "change the second paragraph to…". The plan's v2 document preview gives a draft a clear frame, lets the user edit it in place, and hands the approved text back to the agent.

## What Changes

- New render tool `show_document` for one draft: title, kind (email, message, post, letter, report, other), markdown body and metadata (for an email: to, cc, subject).
- Rendered markdown (headings, lists, links, emphasis, code, tables), never raw HTML.
- "Edit" switches to a plain text editor; "Approve" sends the final text to the agent; "Copy" copies it where the host allows.
- A word and character count, with an optional `limit` for posts with length caps.

Out of scope: sending the email or publishing the post (the agent does that with its own tools after approval), rich-text editing, tracked changes or diffs, attachments, PDF or .docx export.

## Capabilities

### New Capabilities
- `document-preview`: Shows a draft document for review, in-place editing and approval, via `show_document`.

### Modified Capabilities

## Impact

- New folder `src/components/document-preview/` with a small markdown renderer that escapes HTML; adds weight to the bundle, so it must fit the 100 KB budget.
- "Copy" needs clipboard access, which hosts may block inside the sandbox; the button is hidden when it fails.

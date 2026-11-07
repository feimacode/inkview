import type { ComponentMeta } from "../types.js";

export const meta: ComponentMeta = {
  component: "document_preview",
  tool: "show_document",
  title: "Show document",
  schemaVersion: "1",
  description:
    'Show one draft document — an email, message, post, letter, report or other — with a title, metadata and a rendered markdown body, so the user can review it, edit it in place, copy it and approve it. Use it when the answer is text the user will send or publish. Pass the full draft in body (at most 20,000 characters); use kind to pick the header, meta for email to, cc and subject or up to 6 label/value fields, and limit for a platform character cap. Never send or publish the draft yourself: after the user approves, confirm the destination with them before sending. After calling it, add at most one sentence.',
};

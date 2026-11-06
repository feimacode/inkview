/**
 * The contract every Inkview component folder fulfils.
 *
 *   meta.ts       tool name, component id, title, description   (server + view)
 *   schema.ts     zod input schema                               (server only)
 *   markdown.ts   text fallback                                  (server only)
 *   View.tsx      React view                                     (view only)
 *   examples.json sample payloads for the preview gallery and tests
 */
import type { ComponentType } from "react";

export interface ComponentMeta {
  /** Stable id carried in `structuredContent.component`, e.g. "profile_card". */
  component: string;
  /** MCP tool name, e.g. "show_profile_card". */
  tool: string;
  title: string;
  /** Tool description the model reads: what it shows and when to use it. */
  description: string;
  /** Schema major version. */
  schemaVersion: string;
}

/** What a view can ask the host to do. Each is a no-op when the host lacks it. */
export interface ViewActions {
  openLink(url: string): void;
  /** Send a user message into the conversation. */
  sendMessage(text: string): Promise<void>;
  /** Replace this view's contribution to the model context (no chat message). */
  setModelContext?(text: string | null): Promise<void>;
  /** Offer a file to the user. Undefined when the host does not support downloads. */
  download?(filename: string, mimeType: string, text: string): Promise<void>;
  locale: string;
}

export interface ViewProps<T> {
  data: T;
  actions: ViewActions;
}

export interface ViewEntry<T = any> {
  meta: ComponentMeta;
  View: ComponentType<ViewProps<T>>;
  /** Cheap structural check, used instead of shipping zod to the view. */
  accepts(data: unknown): data is T;
}

export interface Example {
  name: string;
  data: Record<string, unknown>;
}

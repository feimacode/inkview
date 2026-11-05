/**
 * Inkview render server: one render tool per component, each tied to a
 * `ui://` resource that holds the component bundle. Stateless: it validates
 * and echoes data back, stores nothing, and never logs tool arguments.
 */
import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer, type CallToolResult, type ReadResourceResult } from "@modelcontextprotocol/server";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  PROFILE_CARD_SCHEMA_VERSION,
  ProfileCardSchema,
  profileCardToMarkdown,
} from "./schemas/profile-card.js";

export const VERSION = "0.1.0";

// dist/server.js and dist/ui/ sit side by side after `npm run build`.
const HERE = path.dirname(fileURLToPath(import.meta.url));
const UI_DIR = path.join(HERE, "ui");

/**
 * Image hosts the profile card may load avatars from. Hosts block any image
 * domain not declared in the resource CSP, so unknown domains fall back to
 * initials. Extend with INKVIEW_IMAGE_DOMAINS (comma separated origins).
 */
const DEFAULT_IMAGE_DOMAINS = [
  "https://avatars.githubusercontent.com",
  "https://media.licdn.com",
  "https://*.gravatar.com",
  "https://unavatar.io",
  "https://upload.wikimedia.org",
  "https://images.unsplash.com",
  "https://pbs.twimg.com",
  "https://i.pravatar.cc",
];

function imageDomains(): string[] {
  const extra = (process.env.INKVIEW_IMAGE_DOMAINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return [...DEFAULT_IMAGE_DOMAINS, ...extra];
}

const PROFILE_CARD_URI = `ui://inkview/profile-card-v${PROFILE_CARD_SCHEMA_VERSION}.html`;

export function createServer(): McpServer {
  const server = new McpServer(
    { name: "inkview", version: VERSION },
    {
      instructions:
        "Inkview draws UI components for data you already have. After you gather information about one specific person, call show_profile_card with it instead of writing the profile out as text. Do not invent fields you do not have.",
    },
  );

  registerAppTool(
    server,
    "show_profile_card",
    {
      title: "Show profile card",
      description:
        "Display one person as a visual profile card in the chat. Use it whenever your answer is about a single person (a candidate, a speaker, a founder, a contact) and you have at least their name plus a headline or a few facts. Pass only data you already gathered from your tools or the conversation; never invent a photo URL or links. For several people, call it once per person (up to 5). After calling it, add at most one sentence of commentary; do not repeat the card's contents.",
      inputSchema: ProfileCardSchema,
      annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
      _meta: { ui: { resourceUri: PROFILE_CARD_URI } },
    },
    async (args): Promise<CallToolResult> => {
      const profile = ProfileCardSchema.parse(args);
      return {
        content: [{ type: "text", text: profileCardToMarkdown(profile) }],
        structuredContent: { component: "profile_card", schemaVersion: PROFILE_CARD_SCHEMA_VERSION, profile },
      };
    },
  );

  registerAppResource(
    server,
    "Inkview profile card",
    PROFILE_CARD_URI,
    { mimeType: RESOURCE_MIME_TYPE, description: "Inkview profile card component" },
    async (): Promise<ReadResourceResult> => {
      const html = await fs.readFile(path.join(UI_DIR, "profile-card.html"), "utf-8");
      const domain = process.env.INKVIEW_UI_DOMAIN;
      return {
        contents: [
          {
            uri: PROFILE_CARD_URI,
            mimeType: RESOURCE_MIME_TYPE,
            text: html,
            _meta: {
              ui: {
                csp: { resourceDomains: imageDomains() },
                prefersBorder: false,
                ...(domain ? { domain } : {}),
              },
            },
          },
        ],
      };
    },
  );

  return server;
}

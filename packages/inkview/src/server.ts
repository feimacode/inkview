/**
 * Inkview render server: one render tool per registered component, all
 * linked to one shared `ui://` resource. Stateless: it validates and echoes
 * data back, stores nothing, and never logs tool arguments.
 */
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { McpServer, type CallToolResult, type ReadResourceResult } from "@modelcontextprotocol/server";
// Inlined at build time (esbuild text loader), so the package needs no files on disk.
import appHtml from "../../../dist/ui/app.html";
import { serverComponents } from "../../../src/components/server-registry.js";
import { imageDomains, resourceMeta } from "./resource.js";
import { serverInstructions } from "./guidance/index.js";
import { autoMeta, autoSchema, runAuto } from "./auto/tool.js";

export const VERSION = __INKVIEW_VERSION__;
export const APP_URI = "ui://inkview/v1/app.html";

export { imageDomains };

export function createServer(): McpServer {
  const server = new McpServer({ name: "inkview", version: VERSION }, { instructions: serverInstructions() });

  for (const c of serverComponents) {
    registerAppTool(
      server,
      c.meta.tool,
      {
        title: c.meta.title,
        description: c.meta.description,
        inputSchema: c.schema,
        annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
        _meta: { ui: { resourceUri: APP_URI } },
      },
      async (args: Record<string, unknown>): Promise<CallToolResult> => {
        const data = c.schema.parse(args);
        const config = c.config?.();
        return {
          content: [{ type: "text", text: c.toMarkdown(data) }],
          structuredContent: {
            component: c.meta.component,
            schemaVersion: c.meta.schemaVersion,
            data,
            ...(config !== undefined ? { config } : {}),
          },
        };
      },
    );
  }

  registerAppTool(
    server,
    autoMeta.tool,
    {
      title: autoMeta.title,
      description: autoMeta.description,
      inputSchema: autoSchema,
      annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
      _meta: { ui: { resourceUri: APP_URI } },
    },
    async (args: { data?: unknown; hint?: string }): Promise<CallToolResult> => {
      const r = runAuto(args);
      return {
        content: [{ type: "text", text: r.text }],
        structuredContent: r.component
          ? { component: r.component, schemaVersion: "1", data: r.data, chosenTool: r.tool }
          : { component: "text", schemaVersion: "1", data: null },
      };
    },
  );

  registerAppResource(
    server,
    "Inkview components",
    APP_URI,
    { mimeType: RESOURCE_MIME_TYPE, description: "Inkview UI components (v1)" },
    async (): Promise<ReadResourceResult> => {
      return {
        contents: [
          {
            uri: APP_URI,
            mimeType: RESOURCE_MIME_TYPE,
            text: appHtml,
            _meta: resourceMeta(),
          },
        ],
      };
    },
  );

  return server;
}

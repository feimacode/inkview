/**
 * Inkview shared view runtime. One bundle serves every component: it connects
 * to the host over the MCP Apps bridge, picks the component from the tool
 * result (or, before the result, from the tool being called), applies host
 * theming and renders loading, cancelled and error states.
 */
import type { App, McpUiHostContext } from "@modelcontextprotocol/ext-apps";
import { useApp, useHostStyles } from "@modelcontextprotocol/ext-apps/react";
import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { byComponent, byTool } from "../components/view-registry.js";
import type { ViewActions, ViewEntry } from "../components/types.js";
import "./theme.css";

type Rendered =
  | { kind: "component"; entry: ViewEntry; data: unknown }
  | { kind: "text"; text: string };

interface ToolResultLike {
  content?: Array<{ type: string; text?: string }>;
  structuredContent?: { component?: unknown; data?: unknown };
}

function fromResult(result: ToolResultLike): Rendered | null {
  const sc = result.structuredContent;
  const entry = typeof sc?.component === "string" ? byComponent.get(sc.component) : undefined;
  if (entry && entry.accepts(sc?.data)) return { kind: "component", entry, data: sc!.data };
  const text = (result.content ?? []).filter((c) => c.type === "text" && c.text).map((c) => c.text).join("\n\n");
  return text ? { kind: "text", text } : null;
}

function fromInput(toolName: string | undefined, args: unknown): Rendered | null {
  const entry = toolName ? byTool.get(toolName) : undefined;
  return entry && entry.accepts(args) ? { kind: "component", entry, data: args } : null;
}

function applyTheme(ctx: McpUiHostContext | undefined) {
  const theme = ctx?.theme;
  if (theme === "light" || theme === "dark") document.documentElement.dataset.theme = theme;
}

function makeActions(app: App): ViewActions {
  const caps = app.getHostCapabilities() ?? {};
  const ctx = app.getHostContext();
  return {
    locale: (ctx?.locale as string | undefined) ?? navigator.language ?? "en-US",
    openLink: (url) => {
      app.openLink({ url }).catch(() => window.open(url, "_blank", "noopener"));
    },
    sendMessage: async (text) => {
      await app.sendMessage({ role: "user", content: [{ type: "text", text }] });
    },
    setModelContext: caps.updateModelContext
      ? async (text) => {
          await app.updateModelContext({ content: text ? [{ type: "text", text }] : [] });
        }
      : undefined,
    download: caps.downloadFile
      ? async (filename, mimeType, text) => {
          await app.downloadFile({
            contents: [{ type: "resource", resource: { uri: `file:///${filename}`, mimeType, text } }],
          });
        }
      : undefined,
  };
}

/** Plain-text rendering for results this bundle has no component for. */
function TextFallback({ text }: { text: string }) {
  return (
    <div className="ink-card">
      <pre className="ink-text">{text}</pre>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="ink-card" aria-busy="true" aria-label="Loading">
      <div className="ink-skeleton" style={{ width: "40%" }} />
      <div className="ink-skeleton" style={{ width: "70%" }} />
      <div className="ink-skeleton" style={{ width: "55%" }} />
    </div>
  );
}

function Root() {
  const [rendered, setRendered] = useState<Rendered | null>(null);
  const [cancelled, setCancelled] = useState(false);

  const { app, error } = useApp({
    appInfo: { name: "Inkview", version: __INKVIEW_VERSION__ },
    capabilities: {},
    onAppCreated: (app) => {
      app.ontoolinput = (params) => {
        const r = fromInput(app.getHostContext()?.toolInfo?.tool?.name, params.arguments);
        if (r) setRendered((prev) => prev ?? r);
      };
      app.ontoolresult = (result) => {
        const r = fromResult(result as ToolResultLike);
        if (r) setRendered(r);
      };
      app.ontoolcancelled = () => setCancelled(true);
      app.onhostcontextchanged = (ctx) => applyTheme({ ...app.getHostContext(), ...ctx });
      app.onerror = (e) => console.error("[inkview]", e);
    },
  });
  useHostStyles(app, app?.getHostContext());
  useEffect(() => applyTheme(app?.getHostContext()), [app]);
  const actions = useMemo(() => (app ? makeActions(app) : null), [app]);

  if (error) {
    return (
      <p className="ink-state" role="alert">
        Inkview couldn't connect to the host: {error.message}
      </p>
    );
  }
  if (!rendered) return cancelled ? <p className="ink-state">Cancelled.</p> : <Skeleton />;
  if (rendered.kind === "text" || !actions) return rendered.kind === "text" ? <TextFallback text={rendered.text} /> : <Skeleton />;
  const { View } = rendered.entry;
  return <View data={rendered.data} actions={actions} />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);

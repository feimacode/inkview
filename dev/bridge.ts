// Minimal MCP Apps host used by the render tests and the preview gallery:
// loads the Inkview view into an iframe and drives it through the official
// AppBridge, the way Claude or ChatGPT would.
import { AppBridge, PostMessageTransport } from "@modelcontextprotocol/ext-apps/app-bridge";

export interface MountOptions {
  html: string;
  toolName: string;
  args: Record<string, unknown>;
  /** Tool result to send; omit to leave the view rendering from the input only. */
  result?: unknown;
  theme: "light" | "dark";
  /** Host capabilities to advertise. Defaults to links, messages, model context and downloads. */
  capabilities?: Record<string, unknown>;
  /** Host style variables to send (omit to test Inkview's own defaults). */
  styleVariables?: Record<string, string>;
  onEvent?: (e: Record<string, unknown>) => void;
  /** Cancel the call before sending any input. */
  cancel?: boolean;
  /** Settings the server would attach to the result. */
  config?: unknown;
}

export const DEFAULT_CAPS = { openLinks: {}, message: { text: {} }, updateModelContext: { text: {} }, downloadFile: {} };

export async function mount(iframe: HTMLIFrameElement, o: MountOptions): Promise<AppBridge> {
  const emit = o.onEvent ?? (() => {});
  const bridge = new AppBridge(null, { name: "inkview-dev-host", version: "0" }, (o.capabilities ?? DEFAULT_CAPS) as never, {
    hostContext: {
      theme: o.theme,
      displayMode: "inline",
      locale: "en-US",
      toolInfo: { tool: { name: o.toolName, inputSchema: { type: "object" } } },
      ...(o.styleVariables ? { styles: { variables: o.styleVariables } } : {}),
    },
  } as never);
  bridge.onopenlink = async (p) => (emit({ openLink: p.url }), {});
  bridge.onmessage = async (p) => (emit({ message: p }), {});
  bridge.onupdatemodelcontext = async (p) => (emit({ modelContext: p }), {});
  bridge.ondownloadfile = async (p) => (emit({ download: p }), {});
  bridge.onsizechange = async (p) => {
    if (p.height) iframe.style.height = `${Math.ceil(p.height)}px`;
  };
  const ready = new Promise<void>((r) => (bridge.oninitialized = () => r()));
  const loaded = new Promise((r) => (iframe.onload = r));
  iframe.srcdoc = o.html;
  await loaded;
  await bridge.connect(new PostMessageTransport(iframe.contentWindow!, iframe.contentWindow!));
  await ready;
  if (o.cancel) {
    await bridge.sendToolCancelled({ reason: "test" } as never);
    return bridge;
  }
  await bridge.sendToolInput({ arguments: o.args });
  if (o.result !== undefined) await bridge.sendToolResult(o.result as never);
  return bridge;
}

/** The tool result the server would return, built from an example payload. */
export function resultFor(component: string, data: Record<string, unknown>, config?: unknown) {
  return {
    content: [{ type: "text", text: `(${component})` }],
    structuredContent: { component, schemaVersion: "1", data, ...(config !== undefined ? { config } : {}) },
  };
}

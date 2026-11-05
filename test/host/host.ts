// Minimal MCP Apps host used only by tests: loads a view into an iframe and
// drives it through the official AppBridge, like Claude or ChatGPT would.
import { AppBridge, PostMessageTransport } from "@modelcontextprotocol/ext-apps/app-bridge";

declare global {
  interface Window {
    __render: (html: string, args: unknown, result: unknown, theme: "light" | "dark") => Promise<void>;
    __events: unknown[];
  }
}
window.__events = [];

window.__render = async (html, args, result, theme) => {
  document.body.style.setProperty("--bg", theme === "dark" ? "#1f1e1d" : "#ffffff");
  const iframe = document.getElementById("view") as HTMLIFrameElement;
  const bridge = new AppBridge(null, { name: "test-host", version: "0" }, { openLinks: {} , message: {} } as never, {
    hostContext: { theme, displayMode: "inline" },
  } as never);
  bridge.onopenlink = async (p) => { window.__events.push({ openLink: p.url }); return {}; };
  bridge.onmessage = async (p) => { window.__events.push({ message: p }); return {}; };
  const ready = new Promise<void>((r) => (bridge.oninitialized = () => r()));
  iframe.srcdoc = html;
  await new Promise((r) => (iframe.onload = r));
  await bridge.connect(new PostMessageTransport(iframe.contentWindow!, iframe.contentWindow!));
  await ready;
  await bridge.sendToolInput({ arguments: args as Record<string, unknown> });
  await bridge.sendToolResult(result as never);
};

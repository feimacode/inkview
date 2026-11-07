// Page driven by the Playwright render tests.
import { mount, resultFor, type MountOptions } from "../bridge";
import appHtml from "../../dist/ui/app.html?raw";

declare global {
  interface Window {
    __render: (o: Omit<MountOptions, "html" | "onEvent"> & { component?: string }) => Promise<void>;
    __events: Record<string, unknown>[];
  }
}
window.__events = [];
window.__render = async (o) => {
  document.body.classList.toggle("dark", o.theme === "dark");
  const iframe = document.getElementById("view") as HTMLIFrameElement;
  const result = o.result !== undefined ? o.result : o.component ? resultFor(o.component, o.args, o.config) : undefined;
  await mount(iframe, { ...o, html: appHtml, result, onEvent: (e) => window.__events.push(e) });
};

import { mount, resultFor } from "../bridge";
import { examples } from "../../src/components/examples";
import appHtml from "../../dist/ui/app.html?raw";

const root = document.getElementById("gallery")!;
for (const { tool, component, examples: list } of Object.values(examples)) {
  const h2 = document.createElement("h2");
  h2.textContent = `${tool} (${component})`;
  root.append(h2);
  for (const ex of list) {
    const row = document.createElement("div");
    row.className = "row";
    for (const theme of ["light", "dark"] as const) {
      const pane = document.createElement("section");
      pane.className = `pane ${theme}`;
      const h3 = document.createElement("h3");
      h3.textContent = `${ex.name} · ${theme}`;
      const iframe = document.createElement("iframe");
      iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
      const log = document.createElement("div");
      log.className = "log";
      pane.append(h3, iframe, log);
      row.append(pane);
      void mount(iframe, {
        html: appHtml,
        toolName: tool,
        args: ex.data,
        result: resultFor(component, ex.data),
        theme,
        onEvent: (e) => (log.textContent = `→ ${JSON.stringify(e).slice(0, 200)}`),
      });
    }
    root.append(row);
  }
}

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";

const { version } = JSON.parse(readFileSync(resolve(import.meta.dirname, "packages/inkview/package.json"), "utf8"));

// The shared view runtime builds to one self-contained HTML file (JS and CSS
// inlined), served as the `ui://inkview/v1/app.html` MCP Apps resource.
// zod (pulled in by the MCP client) loads its English error messages on import.
// The view never shows a protocol validation message to anyone, so a stub that
// returns one fixed message saves about 1 KB gzipped.
const stubZodLocale = {
  name: "inkview:stub-zod-locale",
  enforce: "pre" as const,
  resolveId(source: string, importer?: string) {
    if (importer && /node_modules[\\/]zod[\\/]/.test(importer) && /locales[\\/]en\.js$/.test(source)) return "\0zod-en";
    return null;
  },
  load(id: string) {
    return id === "\0zod-en" ? 'export default () => ({ localeError: () => "Invalid input" });' : null;
  },
};

export default defineConfig({
  root: resolve(import.meta.dirname, "src/ui"),
  plugins: [stubZodLocale, react(), viteSingleFile()],
  define: { __INKVIEW_VERSION__: JSON.stringify(version) },
  // preact/compat keeps the React API (and the SDK's React hooks) at a
  // fraction of react-dom's size; the view bundle has a 100 KB gzip budget.
  resolve: {
    alias: {
      react: "preact/compat",
      "react-dom/client": "preact/compat/client",
      "react-dom": "preact/compat",
      "react/jsx-runtime": "preact/jsx-runtime",
    },
  },
  build: {
    outDir: resolve(import.meta.dirname, "dist/ui"),
    emptyOutDir: true,
    // The single inlined script preloads nothing, so the polyfill is dead weight.
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: resolve(import.meta.dirname, "src/ui/app.html"),
      // The view only uses the App bridge. Without this the MCP client's auth and
      // transport modules stay in the bundle although nothing imports from them.
      treeshake: { moduleSideEffects: (id) => !/node_modules[\\/](@modelcontextprotocol[\\/]client|pkce-challenge)[\\/]/.test(id) },
    },
  },
});

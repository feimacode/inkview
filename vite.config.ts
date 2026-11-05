import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import { resolve } from "node:path";

// Each component builds to one self-contained HTML file (JS and CSS inlined),
// which is what an MCP App `ui://` resource serves.
export default defineConfig({
  root: resolve(import.meta.dirname, "src/ui"),
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: resolve(import.meta.dirname, "dist/ui"),
    emptyOutDir: true,
    rollupOptions: { input: resolve(import.meta.dirname, "src/ui/profile-card.html") },
  },
});

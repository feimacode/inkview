import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { resolve } from "node:path";
export default defineConfig({
  root: resolve(import.meta.dirname, "host"),
  plugins: [viteSingleFile()],
  logLevel: "warn",
  build: { outDir: resolve(import.meta.dirname, "../dist-test/host"), emptyOutDir: true },
});

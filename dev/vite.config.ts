// Builds the dev pages (render-test host or preview gallery) into single files.
// DEV_PAGE=host|gallery
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { resolve } from "node:path";

const page = process.env.DEV_PAGE ?? "host";
export default defineConfig({
  root: resolve(import.meta.dirname, page),
  plugins: [viteSingleFile()],
  logLevel: "warn",
  build: { outDir: resolve(import.meta.dirname, `../dist-dev/${page}`), emptyOutDir: true },
});

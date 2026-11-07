// Bundles the server, its dependencies and the view HTML into one file,
// packages/inkview/dist/inkview.js, so the published package has no runtime dependencies.
import { build } from "esbuild";
import { readFileSync, chmodSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const PKG = resolve(ROOT, "packages/inkview");
const view = resolve(ROOT, "dist/ui/app.html");
if (!existsSync(view)) {
  console.error("dist/ui/app.html is missing: run npm run build:ui first.");
  process.exit(1);
}
const { version } = JSON.parse(readFileSync(resolve(PKG, "package.json"), "utf8"));

await build({
  entryPoints: [resolve(PKG, "src/main.ts")],
  outfile: resolve(PKG, "dist/inkview.js"),
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  minify: true,
  legalComments: "linked",
  loader: { ".html": "text" },
  define: { __INKVIEW_VERSION__: JSON.stringify(version) },
  // The hashbang comes from src/main.ts. CommonJS dependencies (express) call require(); give ESM output one.
  banner: {
    js: "import { createRequire as __inkCreateRequire } from 'node:module';\nconst require = __inkCreateRequire(import.meta.url);",
  },
  logLevel: "warning",
});
chmodSync(resolve(PKG, "dist/inkview.js"), 0o755);

// Bundles the server, its dependencies and the view HTML into one file,
// dist/inkview.js, so the published package has no runtime dependencies.
import { build } from "esbuild";
import { readFileSync, chmodSync } from "node:fs";

const { version } = JSON.parse(readFileSync("package.json", "utf8"));

await build({
  entryPoints: ["src/main.ts"],
  outfile: "dist/inkview.js",
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
chmodSync("dist/inkview.js", 0o755);

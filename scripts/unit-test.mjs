// Bundles test/unit/*.test.ts with esbuild and runs them with node:test.
import { build } from "esbuild";
import { readdirSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";

mkdirSync("dist-test/unit", { recursive: true });
const files = readdirSync("test/unit").filter((f) => f.endsWith(".test.ts"));
await build({
  entryPoints: files.map((f) => `test/unit/${f}`),
  outdir: "dist-test/unit",
  bundle: true,
  platform: "node",
  format: "esm",
  outExtension: { ".js": ".mjs" },
  packages: "external",
  loader: { ".html": "text" },
  define: { __INKVIEW_VERSION__: '"test"' },
  logLevel: "warning",
});
const r = spawnSync(process.execPath, ["--test", ...files.map((f) => `dist-test/unit/${f.replace(".ts", ".mjs")}`)], { stdio: "inherit" });
process.exit(r.status ?? 1);

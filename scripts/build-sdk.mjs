// Bundles the SDK and the shared view HTML into one ESM file, then emits
// self-contained type declarations. The MCP SDK stays external.
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const PKG = resolve(ROOT, "packages/sdk");
const view = resolve(ROOT, "dist/ui/app.html");
if (!existsSync(view)) {
  console.error("dist/ui/app.html is missing: run npm run build:ui first.");
  process.exit(1);
}

await build({
  entryPoints: [resolve(PKG, "src/index.ts")],
  outfile: resolve(PKG, "dist/index.js"),
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  legalComments: "linked",
  loader: { ".html": "text" },
  external: ["@modelcontextprotocol/*"],
  logLevel: "warning",
});

execFileSync(process.execPath, [resolve(ROOT, "node_modules/typescript/bin/tsc"), "-p", resolve(PKG, "tsconfig.json")], {
  stdio: "inherit",
});

const emitted = resolve(PKG, "dist/packages/sdk/src/index.d.ts");
if (!existsSync(emitted)) {
  console.error("declaration build did not produce packages/sdk/src/index.d.ts");
  process.exit(1);
}
writeFileSync(resolve(PKG, "dist/index.d.ts"), 'export * from "./packages/sdk/src/index.js";\n');

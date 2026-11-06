// Packs dist/inkview.js into dist/inkview.mcpb (Claude Desktop one-click install).
import { mkdirSync, copyFileSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { execSync } from "node:child_process";

const { version } = JSON.parse(readFileSync("package.json", "utf8"));
const dir = "dist/mcpb";
rmSync(dir, { recursive: true, force: true });
mkdirSync(`${dir}/server`, { recursive: true });
const manifest = JSON.parse(readFileSync("mcpb/manifest.json", "utf8"));
manifest.version = version;
writeFileSync(`${dir}/manifest.json`, JSON.stringify(manifest, null, 2));
copyFileSync("dist/inkview.js", `${dir}/server/inkview.js`);
copyFileSync("LICENSE", `${dir}/LICENSE`);
execSync(`npx -y @anthropic-ai/mcpb@2.1.2 validate ${dir}/manifest.json`, { stdio: "inherit" });
execSync(`npx -y @anthropic-ai/mcpb@2.1.2 pack ${dir} dist/inkview-${version}.mcpb`, { stdio: "inherit" });

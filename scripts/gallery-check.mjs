// Checks the built gallery (dist-dev/gallery) shows every example of every component, light and dark.
import { chromium } from "playwright";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";

const dirs = readdirSync("src/components", { withFileTypes: true }).filter((d) => d.isDirectory());
const expected = dirs.reduce((n, d) => n + JSON.parse(readFileSync(`src/components/${d.name}/examples.json`, "utf8")).length * 2, 0);
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto("file://" + resolve("dist-dev/gallery/index.html"));
  await page.waitForFunction((n) => document.querySelectorAll("iframe").length >= n, expected, { timeout: 15000 });
  for (const d of dirs) {
    const tool = readFileSync(`src/components/${d.name}/meta.ts`, "utf8").match(/tool:\s*"([^"]+)"/)[1];
    assert.ok(await page.getByText(tool, { exact: false }).first().isVisible(), `${tool} section shown`);
  }
  console.log(`✓ gallery shows ${expected} example frames across ${dirs.length} components`);
} finally {
  await browser.close();
}

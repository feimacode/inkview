// Renders every component example in the dev host (light, dark, 320 px),
// checks contrast, keyboard focus, runtime states and per-component
// interactions, and saves screenshots to dist-test/.
import { chromium } from "playwright";
import { mkdirSync, readdirSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const hostUrl = pathToFileURL("dist-dev/host/index.html").href;
mkdirSync("dist-test", { recursive: true });
const componentDirs = readdirSync("src/components", { withFileTypes: true }).filter((d) => d.isDirectory());
const only = process.argv[2];

/** Contrast check over all visible text in the frame (WCAG AA). */
const contrastProbe = () => {
  const parse = (c) => (c.match(/[\d.]+/g) || []).map(Number);
  const lum = ([r, g, b]) => {
    const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const bgOf = (el) => {
    for (let e = el; e; e = e.parentElement) {
      const c = parse(getComputedStyle(e).backgroundColor);
      if (c.length === 3 || (c.length === 4 && c[3] > 0.9)) return c.slice(0, 3);
    }
    return document.documentElement.dataset.theme === "dark" || matchMedia("(prefers-color-scheme: dark)").matches ? [31, 30, 29] : [255, 255, 255];
  };
  const fails = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const el = walker.currentNode.parentElement;
    if (!walker.currentNode.textContent.trim() || !el || !el.getClientRects().length) continue;
    const s = getComputedStyle(el);
    if (s.visibility === "hidden" || el.closest("[aria-hidden=true]") || el.closest("button:disabled") || el.closest("svg")) continue;
    const fg = parse(s.color).slice(0, 3);
    const [l1, l2] = [lum(fg), lum(bgOf(el))].sort((a, b) => b - a);
    const ratio = (l1 + 0.05) / (l2 + 0.05);
    const large = parseFloat(s.fontSize) >= 18 || (parseFloat(s.fontSize) >= 14 && Number(s.fontWeight) >= 700);
    if (ratio < (large ? 3 : 4.5)) fails.push(`${walker.currentNode.textContent.trim().slice(0, 30)} (${ratio.toFixed(2)})`);
  }
  return fails;
};

const browser = await chromium.launch();
const ctx = (theme, width = 720) => browser.newPage({ viewport: { width, height: 900 }, colorScheme: theme });

async function render(page, opts) {
  await page.goto(hostUrl);
  await page.evaluate((o) => window.__render(o), opts);
  return page.frameLocator("#view");
}

let failures = 0;
async function check(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
  } catch (e) {
    failures++;
    console.error(`✗ ${name}\n  ${e.message.split("\n").slice(0, 4).join("\n  ")}`);
  }
}

try {
  for (const dir of componentDirs) {
    const examples = require(`../src/components/${dir.name}/examples.json`);
    // Read ids from meta.ts as text, so this runs on Node versions without TypeScript support.
    const metaSrc = readFileSync(`src/components/${dir.name}/meta.ts`, "utf8");
    const id = metaSrc.match(/component:\s*"([^"]+)"/)[1];
    const tool = metaSrc.match(/tool:\s*"([^"]+)"/)[1];
    if (only && only !== dir.name) continue;
    for (const [i, ex] of examples.entries()) {
      for (const theme of ["light", "dark"]) {
        await check(`${dir.name} · ${ex.name} · ${theme}`, async () => {
          const page = await ctx(theme);
          const errors = [];
          page.on("pageerror", (e) => errors.push(e.message));
          const frame = await render(page, { toolName: tool, component: id, args: ex.data, theme });
          await frame.locator(".ink-card").first().waitFor({ timeout: 5000 });
          await page.waitForTimeout(150);
          await page.screenshot({ path: `dist-test/${dir.name}-${i}-${theme}.png`, fullPage: true });
          const fails = await frame.locator("body").evaluate(contrastProbe);
          assert.deepEqual(fails, [], `low contrast: ${fails.join(", ")}`);
          assert.deepEqual(errors, []);
          await page.close();
        });
      }
      await check(`${dir.name} · ${ex.name} · 320 px`, async () => {
        const page = await ctx("light", 352);
        const frame = await render(page, { toolName: tool, component: id, args: ex.data, theme: "light" });
        await frame.locator(".ink-card").first().waitFor({ timeout: 5000 });
        await page.screenshot({ path: `dist-test/${dir.name}-${i}-320.png`, fullPage: true });
        const overflow = await frame.locator("body").evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        assert.ok(overflow <= 0, `horizontal overflow of ${overflow}px`);
        await page.close();
      });
    }
    await check(`${dir.name} · keyboard focus is visible`, async () => {
      const page = await ctx("light");
      const frame = await render(page, { toolName: tool, component: id, args: examples[0].data, theme: "light" });
      await frame.locator(".ink-card").first().waitFor();
      const count = await frame.locator("button:not(:disabled), a[href], input, select, [tabindex='0']").count();
      await frame.locator("body").click({ position: { x: 1, y: 1 } });
      for (let k = 0; k < Math.min(count, 12); k++) {
        await page.keyboard.press("Tab");
        const visible = await frame.locator("body").evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body) return true;
          const s = getComputedStyle(el);
          return s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0;
        });
        assert.ok(visible, `focused element ${k + 1} has no visible focus ring`);
      }
      await page.close();
    });
    let specific;
    try {
      specific = (await import(pathToFileURL(`dev/tests/${dir.name}.mjs`).href)).default;
    } catch {}
    if (specific) {
      for (const [name, fn] of Object.entries(specific)) {
        await check(`${dir.name} · ${name}`, async () => {
          const page = await ctx("light");
          const r = (args, extra = {}) => render(page, { toolName: tool, component: id, args, theme: "light", ...extra });
          await fn({ page, render: r, examples, events: () => page.evaluate(() => window.__events), assert });
          await page.close();
        });
      }
    }
  }

  if (!only) {
    await check("runtime · unknown component shows the text result", async () => {
      const page = await ctx("light");
      const frame = await render(page, {
        toolName: "show_future_thing",
        args: {},
        result: { content: [{ type: "text", text: "### Fallback text" }], structuredContent: { component: "future_thing", data: {} } },
        theme: "light",
      });
      await frame.getByText("### Fallback text").waitFor({ timeout: 5000 });
      await page.close();
    });
    await check("runtime · renders early from tool input", async () => {
      const page = await ctx("light");
      const frame = await render(page, { toolName: "show_profile_card", args: { name: "Early Bird" }, theme: "light" });
      await frame.getByRole("heading", { name: "Early Bird" }).waitFor({ timeout: 5000 });
      await page.close();
    });
    await check("runtime · cancelled before data", async () => {
      const page = await ctx("light");
      const frame = await render(page, { toolName: "show_profile_card", args: {}, cancel: true, theme: "light" });
      await frame.getByText("Cancelled").waitFor({ timeout: 5000 });
      await page.close();
    });
    await check("runtime · host style variables are applied", async () => {
      const page = await ctx("light");
      const frame = await render(page, {
        toolName: "show_profile_card",
        component: "profile_card",
        args: { name: "Styled" },
        theme: "light",
        styleVariables: { "--color-background-primary": "rgb(250, 240, 230)" },
      });
      const bg = await frame.locator(".ink-card").first().evaluate((el) => getComputedStyle(el).backgroundColor);
      assert.equal(bg, "rgb(250, 240, 230)");
      await page.close();
    });
  }
} finally {
  await browser.close();
}
if (failures) {
  console.error(`${failures} render check(s) failed`);
  process.exit(1);
}
console.log("All render checks passed.");

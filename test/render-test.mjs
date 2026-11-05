// Renders the profile card in a minimal MCP Apps host (light + dark), checks
// the actions reach the host, and saves screenshots to dist-test/.
import { chromium } from "playwright";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";

const viewHtml = await readFile("dist/ui/profile-card.html", "utf8");
const hostUrl = pathToFileURL("dist-test/host/index.html").href;

const profile = {
  name: "Mira Hoffmann",
  headline: "Staff Rust Engineer at Ferrous Labs",
  company: "Ferrous Labs",
  location: "Berlin, Germany",
  about: "Builds low-latency storage engines in Rust. Previously led the query runtime team at a large analytics company and maintains two popular async crates.",
  highlights: ["10 years in systems programming, 6 in Rust", "Maintainer of an async I/O crate with 4M downloads", "Speaker at RustConf 2025"],
  tags: ["Rust", "Tokio", "Databases", "Distributed systems"],
  links: [{ label: "GitHub", url: "https://github.com/example" }, { label: "Website", url: "https://example.com" }],
  profileUrl: "https://example.com/mira",
  source: { name: "Example search", url: "https://example.com/search" },
};
const result = {
  content: [{ type: "text", text: "### Mira Hoffmann" }],
  structuredContent: { component: "profile_card", schemaVersion: "1", profile },
};

const browser = await chromium.launch();
try {
  for (const theme of ["light", "dark"]) {
    const page = await browser.newPage({ viewport: { width: 680, height: 560 }, colorScheme: theme });
    page.on("pageerror", (e) => console.error("pageerror:", e.message));
    await page.goto(hostUrl);
    await page.evaluate(([h, a, r, t]) => window.__render(h, a, r, t), [viewHtml, profile, result, theme]);
    const frame = page.frameLocator("#view");
    await frame.getByRole("heading", { name: "Mira Hoffmann" }).waitFor({ timeout: 5000 });
    await page.screenshot({ path: `dist-test/profile-card-${theme}.png` });
    console.log(`✓ rendered (${theme})`);

    if (theme === "light") {
      await frame.getByRole("button", { name: "Open profile" }).click();
      await frame.getByRole("button", { name: "Draft outreach" }).click();
      await page.waitForTimeout(300);
      const events = await page.evaluate(() => window.__events);
      assert.ok(events.some((e) => e.openLink === profile.profileUrl), "Open profile → host openLink");
      assert.ok(events.some((e) => e.message?.content?.[0]?.text?.includes("Draft a short")), "Draft outreach → host message");
      console.log("✓ actions reach the host (openLink, message)");
    }
    await page.close();
  }

  // Narrow phone width, minimal data (initials avatar, no optional fields).
  const page = await browser.newPage({ viewport: { width: 360, height: 300 } });
  await page.goto(hostUrl);
  const min = { name: "Grace Hopper" };
  await page.evaluate(([h, a, r]) => window.__render(h, a, r, "light"), [viewHtml, min, { content: [], structuredContent: { profile: min } }]);
  await page.frameLocator("#view").getByText("GH").waitFor({ timeout: 5000 });
  await page.screenshot({ path: "dist-test/profile-card-minimal.png" });
  console.log("✓ rendered minimal profile with initials");
} finally {
  await browser.close();
}

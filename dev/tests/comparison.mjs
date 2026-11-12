export default {
  async "highlights the recommendation and sends a choice"({ render, examples, events, assert, page }) {
    const frame = await render(examples[0].data);
    await frame.getByText("Recommended: Notion.").waitFor();
    await frame.locator(".cmp-wide").getByRole("button", { name: "Choose Obsidian" }).click();
    await page.waitForTimeout(200);
    assert.match((await events()).find((e) => e.message).message.content[0].text, /^I choose Obsidian/);
  },
  async "shows yes, no and ratings with labels"({ render, examples, assert }) {
    const frame = await render(examples[0].data);
    const wide = frame.locator(".cmp-wide");
    assert.ok((await wide.getByText("✓ Yes").count()) >= 2);
    assert.ok((await wide.getByText("✕ No").count()) >= 2);
    await wide.getByRole("img", { name: "5 out of 5" }).waitFor();
  },
  async "stacks into cards at phone width"({ render, examples, page, assert }) {
    await page.setViewportSize({ width: 352, height: 900 });
    const frame = await render(examples[0].data);
    await frame.locator(".cmp-narrow .cmp-card").first().waitFor();
    assert.equal(await frame.locator(".cmp-narrow .cmp-card").count(), 3);
    assert.equal(await frame.locator(".cmp-wide").isVisible(), false);
  },
  async "draws journey values for three flight finalists"({ render, examples, assert }) {
    const frame = await render(examples.find((e) => e.name === "Flight finalists").data);
    const wide = frame.locator(".cmp-wide");
    assert.equal(await wide.locator(".jr").count(), 3);
    assert.deepEqual(await wide.locator(".jr .ink-sr").allTextContents(), [
      "SYD 10:20 → HND 17:55 · Direct · 9h 35m · Qantas",
      "SYD 09:15 → NRT 07:40 (+1) · 1 stop SIN 9h 30m · 24h 25m · Singapore Airlines",
      "SYD 06:05 → NRT 17:35 · 1 stop CNS 3h 20m · 13h 30m · Jetstar",
    ]);
    assert.equal(await wide.locator(".jr-day").textContent(), "+1");
  },
};

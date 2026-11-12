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
  async "opens an option's site and names both option sources in the footer"({ render, events, assert, page }) {
    const frame = await render({
      items: [
        { name: "Harbour Inn", url: "https://example.com/harbour", source: { name: "Booking.com", url: "https://www.booking.com" }, unverified: ["Price"] },
        { name: "Quay Loft", source: { name: "Airbnb", url: "https://www.airbnb.com" } },
      ],
      criteria: ["Price", "Rating"],
      values: [["A$289", "4.5"], ["A$240", "4.8"]],
    });
    const wide = frame.locator(".cmp-wide");
    assert.equal(await wide.getByRole("button", { name: /at site/ }).count(), 1, "only the option with a url gets the action");
    await wide.getByRole("button", { name: "Open Harbour Inn at site" }).click();
    await page.waitForTimeout(150);
    assert.ok((await events()).some((e) => e.openLink === "https://example.com/harbour"));
    assert.equal(await wide.getByRole("img", { name: "not checked" }).count(), 1);
    assert.match(await frame.locator(".ink-source").textContent(), /^Source: Booking\.com, Airbnb/);
    assert.equal(await frame.getByText(/\bbook\b|reserve|checkout/i).count(), 0);
  },
};

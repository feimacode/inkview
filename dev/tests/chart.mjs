export default {
  async "keyboard focus reads exact values"({ render, examples, assert, page }) {
    const frame = await render(examples[1].data);
    await frame.locator(".ch-plot").focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    const tip = await frame.locator(".ch-tip").innerText();
    assert.match(tip, /us-west/);
    assert.match(tip, /205 ms/);
  },
  async "legend hides a series but keeps one visible"({ render, examples, assert }) {
    const frame = await render(examples[0].data);
    await frame.getByRole("button", { name: "Pro" }).click();
    assert.equal(await frame.locator(".ch-line").count(), 1);
    assert.equal(await frame.getByRole("button", { name: "Team" }).isDisabled(), true);
  },
  async "has a text summary for screen readers"({ render, examples, assert }) {
    const frame = await render(examples[0].data);
    const label = await frame.locator(".ch-plot").getAttribute("aria-label");
    assert.match(label, /Pro from 42000 USD to 74800 USD/);
  },
  async "draws bars below zero"({ render, examples, assert }) {
    const frame = await render(examples[2].data);
    await frame.locator(".ch-bar").first().waitFor();
    assert.equal(await frame.locator(".ch-bar").count(), 12);
  },
  async "the footer shows when the source was checked, and no footer without a source"({ render, examples, assert }) {
    const data = { ...examples[0].data, source: { name: "Example source", url: "https://example.com/data", retrievedAt: new Date(Date.now() - 2 * 3_600_000).toISOString() } };
    let frame = await render(data);
    assert.equal(await frame.locator(".ink-source").last().textContent(), "Source: Example source · checked 2 hours ago");
    const { source, ...bare } = data;
    frame = await render(bare);
    await frame.locator(".ink-card").first().waitFor();
    assert.equal(await frame.locator(".ink-source").count(), 0, "nothing price-like here, so no \"No source given\"");
  },
};

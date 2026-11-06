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
};

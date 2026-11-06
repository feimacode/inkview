// Interaction checks for the profile grid (run by scripts/render-test.mjs).
export default {
  async "expands a person into the full profile and returns to the grid"({ render, examples, assert }) {
    const frame = await render(examples[0].data);
    await frame.getByRole("button", { name: "Open profile of Mira Hoffmann" }).click();
    await frame.getByRole("button", { name: "Draft outreach" }).waitFor();
    assert.equal(await frame.locator(".pgr-grid").count(), 0);
    await frame.getByRole("heading", { name: "Mira Hoffmann" }).waitFor();
    await frame.getByRole("button", { name: "← Back to all" }).click();
    await frame.locator(".pgr-grid").waitFor();
    assert.equal(await frame.getByRole("button", { name: "Draft outreach" }).count(), 0);
  },
  async "shows compact fields and initials for missing photos"({ render, examples }) {
    const frame = await render(examples[2].data);
    await frame.getByText("GH", { exact: true }).waitFor();
    await frame.getByText("AL", { exact: true }).waitFor();
  },
  async "ask about selected sends a message naming each person"({ render, examples, events, assert, page }) {
    const frame = await render(examples[0].data);
    const ask = frame.getByRole("button", { name: /Ask about selected/ });
    assert.equal(await ask.isDisabled(), true);
    await frame.getByRole("checkbox", { name: "Select Mira Hoffmann" }).check();
    await frame.getByRole("checkbox", { name: "Select Daniel Okafor" }).check();
    await ask.click();
    await page.waitForTimeout(200);
    const msg = (await events()).find((e) => e.message).message.content[0].text;
    assert.match(msg, /Mira Hoffmann/);
    assert.match(msg, /Daniel Okafor/);
    assert.equal(msg.split("\n").filter((l) => l.startsWith("- ")).length, 2);
  },
  async "shortlist updates model context and removal shrinks it"({ render, examples, events, assert, page }) {
    const frame = await render(examples[0].data);
    await frame.getByRole("checkbox", { name: "Select Mira Hoffmann" }).check();
    await frame.getByRole("checkbox", { name: "Select Daniel Okafor" }).check();
    await frame.getByRole("button", { name: "Add to shortlist (2)" }).click();
    await frame.locator(".pgr-shortlist").waitFor();
    assert.deepEqual(await frame.locator(".pgr-shortlist li span").allInnerTexts(), ["Mira Hoffmann", "Daniel Okafor"]);
    await frame.getByRole("button", { name: "Remove Mira Hoffmann from shortlist" }).click();
    await page.waitForTimeout(200);
    const ctx = (await events()).filter((e) => e.modelContext).map((e) => e.modelContext.content);
    assert.equal(ctx.length, 2);
    assert.match(ctx[0][0].text, /Mira Hoffmann/);
    assert.match(ctx[0][0].text, /Daniel Okafor/);
    assert.match(ctx[1][0].text, /Daniel Okafor/);
    assert.doesNotMatch(ctx[1][0].text, /Mira Hoffmann/);
    await frame.getByRole("button", { name: "Remove Daniel Okafor from shortlist" }).click();
    await page.waitForTimeout(200);
    assert.equal(await frame.locator(".pgr-shortlist").count(), 0);
    const after = (await events()).filter((e) => e.modelContext).map((e) => e.modelContext.content);
    assert.deepEqual(after[2], []);
  },
  async "shortlist is hidden when the host has no model context"({ render, examples, assert }) {
    const frame = await render(examples[0].data, { capabilities: { openLinks: {}, message: { text: {} } } });
    await frame.getByRole("checkbox", { name: "Select Mira Hoffmann" }).waitFor();
    assert.equal(await frame.getByRole("button", { name: /Add to shortlist/ }).count(), 0);
  },
};

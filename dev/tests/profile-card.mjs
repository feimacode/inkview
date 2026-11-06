// Interaction checks for the profile card (run by scripts/render-test.mjs).
export default {
  async "open profile and draft outreach reach the host"({ render, examples, events, assert, page }) {
    const frame = await render(examples[0].data);
    await frame.getByRole("button", { name: "Open profile" }).click();
    await frame.getByRole("button", { name: "Draft outreach" }).click();
    await page.waitForTimeout(200);
    const ev = await events();
    assert.ok(ev.some((e) => e.openLink === examples[0].data.profileUrl));
    assert.ok(ev.some((e) => e.message?.content?.[0]?.text?.startsWith("Draft a short")));
  },
  async "shortlist updates model context and can be undone"({ render, examples, events, assert, page }) {
    const frame = await render(examples[0].data);
    await frame.getByRole("button", { name: "Add to shortlist" }).click();
    await frame.getByRole("button", { name: "Shortlisted ✓" }).click();
    await frame.getByRole("button", { name: "Add to shortlist" }).waitFor();
    const ctx = (await events()).filter((e) => e.modelContext).map((e) => e.modelContext.content);
    assert.equal(ctx.length, 2);
    assert.match(ctx[0][0].text, /Mira Hoffmann/);
    assert.deepEqual(ctx[1], []);
  },
  async "shortlist is hidden when the host has no model context"({ render, examples, assert }) {
    const frame = await render(examples[0].data, { capabilities: { openLinks: {}, message: { text: {} } } });
    await frame.getByRole("button", { name: "Draft outreach" }).waitFor();
    assert.equal(await frame.getByRole("button", { name: "Add to shortlist" }).count(), 0);
  },
  async "initials replace a missing avatar"({ render, assert }) {
    const frame = await render({ name: "Grace Hopper" });
    await frame.getByText("GH").waitFor();
    assert.ok(true);
  },
};

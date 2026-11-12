export default {
  async "open website and compare reach the host"({ render, examples, events, assert, page }) {
    const frame = await render(examples[0].data);
    await frame.getByRole("button", { name: "Open website" }).click();
    await frame.getByRole("button", { name: "Compare" }).click();
    await page.waitForTimeout(200);
    const ev = await events();
    assert.ok(ev.some((e) => e.openLink === "https://stripe.com"));
    assert.match(ev.find((e) => e.message).message.content[0].text, /Compare Stripe/);
  },
  async "shows a monogram without a logo"({ render, assert }) {
    const frame = await render({ name: "Acme Robotics" });
    await frame.getByText("AR", { exact: true }).waitFor();
    assert.ok(true);
  },
  async "offers open website, call and directions for a place with phone and address"({ render, examples, events, assert, page }) {
    const frame = await render(examples.find((e) => e.name === "Local business with phone and address").data);
    for (const name of ["Open website", "Call", "Directions"]) await frame.getByRole("button", { name, exact: true }).click();
    await page.waitForTimeout(200);
    const opened = (await events()).filter((e) => e.openLink).map((e) => e.openLink);
    assert.equal(opened[0], "https://example.com/harris-park-plumbing");
    assert.equal(opened[1], "tel:0295550142");
    assert.match(opened[2], /^https:\/\/www\.openstreetmap\.org\/search\?query=12%20Marion%20St/);
    assert.match(await frame.locator(".ec-contact").textContent(), /\(02\) 9555 0142/);
    await frame.getByRole("button", { name: "More", exact: true }).click();
    assert.deepEqual(await frame.locator(".ink-more .ink-btn").allInnerTexts(), ["Copy phone", "Copy address"]);
  },
  async "shows no contact actions without the fields, and marks an unverified phone"({ render, assert }) {
    let frame = await render({ name: "Acme Robotics" });
    await frame.locator(".ink-card").waitFor();
    assert.equal(await frame.getByRole("button", { name: /Call|Directions|Open website|Copy/ }).count(), 0);
    assert.equal(await frame.locator(".ink-source").textContent(), "No source given");

    frame = await render({ name: "Tap Shop", phone: "0400 555 019", facts: [{ label: "Founded", value: "1990" }], unverified: ["phone"], source: { name: "Yellow Pages", retrievedAt: new Date(Date.now() - 2 * 3_600_000).toISOString() } });
    assert.equal(await frame.locator(".ec-contact").getByRole("img", { name: "not checked" }).count(), 1);
    assert.equal(await frame.getByRole("img", { name: "not checked" }).count(), 1);
    assert.match(await frame.locator(".ink-source").textContent(), /^Source: Yellow Pages · checked 2 hours ago ◦ = not checked against a source$/);
  },
};

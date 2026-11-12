export default {
  async "sorts by price with unpriced last"({ render, examples, assert }) {
    const frame = await render(examples[2].data);
    await frame.getByRole("combobox").selectOption("price-asc");
    const names = await frame.locator(".pg-name").allInnerTexts();
    assert.deepEqual(names, ["Fairphone 6", "Framework Laptop 13 DIY Edition", "Shift6mq"]);
  },
  async "shows out of stock"({ render, examples }) {
    const frame = await render(examples[0].data);
    await frame.getByText("· Out of stock").waitFor();
  },
  async "view at store opens the product url, compare sends 2 to 4"({ render, examples, events, assert, page }) {
    const frame = await render(examples[0].data);
    await frame.getByRole("button", { name: "View Bose QuietComfort Ultra Headphones at store" }).click();
    const compare = frame.getByRole("button", { name: /Compare selected/ });
    assert.equal(await compare.isDisabled(), true);
    for (const t of ["Sony WH-1000XM6", "Bose QuietComfort", "Apple AirPods Max", "Sennheiser Momentum 4"])
      await frame.getByRole("checkbox", { name: new RegExp(`Select ${t}`) }).check();
    assert.equal(await frame.getByRole("checkbox", { name: /Select Anker/ }).isDisabled(), true);
    await compare.click();
    await page.waitForTimeout(200);
    const ev = await events();
    assert.ok(ev.some((e) => e.openLink === "https://example.com/p/bose-qc-ultra"));
    const msg = ev.find((e) => e.message).message.content[0].text;
    assert.equal(msg.split("\n").filter((l) => l.startsWith("- ")).length, 4);
  },
  async "offers no cart or checkout"({ render, examples, assert }) {
    const frame = await render(examples[0].data);
    await frame.locator(".pg-card").first().waitFor();
    assert.equal(await frame.getByText(/add to cart|checkout|buy now/i).count(), 0);
  },
  async "copy link sits beside view at store"({ render, examples, assert, page }) {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    const frame = await render(examples[0].data);
    const card = frame.locator(".pg-card").first();
    assert.equal(await card.getByRole("button", { name: /^View .+ at store$/ }).count(), 1);
    const copy = card.getByRole("button", { name: /^Copy link of / });
    await copy.click();
    await card.getByText("Copied").waitFor();
  },
  async "day-old prices are flagged, and an unverified price is marked"({ render, assert }) {
    const product = { title: "Tee", url: "https://s.io/tee", price: 9.5, currency: "USD" };
    let frame = await render({ products: [product], source: { name: "Shop", url: "https://s.io", retrievedAt: new Date(Date.now() - 30 * 3_600_000).toISOString() } });
    assert.equal(await frame.locator(".ink-source").textContent(), "Source: Shop · checked 1 day ago · may have changed");
    frame = await render({ products: [{ ...product, unverified: ["price"] }, { ...product, title: "Cap" }] });
    assert.equal(await frame.getByRole("img", { name: "not checked" }).count(), 1);
    assert.match(await frame.locator(".ink-source").textContent(), /^No source given ◦ = not checked/);
  },
};

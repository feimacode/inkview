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
};

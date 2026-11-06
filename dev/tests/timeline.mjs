export default {
  async "sorts mixed precision dates in both orders"({ render, assert }) {
    const frame = await render({
      events: [
        { date: "2019-04-12", title: "Series A" },
        { date: "2019", title: "Founded" },
        { date: "2019-02", title: "Prototype" },
      ],
    });
    await frame.locator(".tl-event").first().waitFor();
    assert.deepEqual(await frame.locator(".tl-event-title").allTextContents(), ["Founded", "Prototype", "Series A"]);
    assert.deepEqual(await frame.locator(".tl-date").allTextContents(), ["2019", "February 2019", "Apr 12, 2019"]);
    await frame.getByRole("button", { name: "Oldest first", exact: true }).click();
    assert.deepEqual(await frame.locator(".tl-event-title").allTextContents(), ["Series A", "Prototype", "Founded"]);
    assert.deepEqual(await frame.locator(".tl-date").allTextContents(), ["Apr 12, 2019", "February 2019", "2019"]);
  },
  async "expands event detail with Enter"({ render, page, assert }) {
    const frame = await render({ events: [{ date: "2019-04-12", title: "Series A", detail: "Raised $12M for expansion." }] });
    const button = frame.getByRole("button", { name: "Series A", exact: true });
    assert.equal(await button.getAttribute("aria-expanded"), "false");
    assert.equal(await frame.getByText("Raised $12M for expansion.", { exact: true }).isVisible(), false);
    await button.focus();
    await page.keyboard.press("Enter");
    assert.equal(await button.getAttribute("aria-expanded"), "true");
    assert.equal(await frame.getByText("Raised $12M for expansion.", { exact: true }).isVisible(), true);
  },
  async "tell me more and open reach the host"({ render, events, page, assert }) {
    const frame = await render({
      events: [{ date: "2021-03", title: "Series A raised", url: "https://example.com/northstar/series-a" }],
    });
    await frame.getByRole("button", { name: "Tell me more", exact: true }).click();
    await frame.getByRole("button", { name: "Open", exact: true }).click();
    await page.waitForTimeout(200);
    const hostEvents = await events();
    assert.ok(hostEvents.some((event) => event.openLink === "https://example.com/northstar/series-a"));
    const message = hostEvents.find((event) => event.message)?.message.content[0].text;
    assert.match(message, /Series A raised/);
    assert.match(message, /2021-03/);
  },
  async "colors and filters categories without changing order"({ render, assert }) {
    const frame = await render({
      events: [
        { date: "2024", title: "Public launch", category: "Product" },
        { date: "2020", title: "Seed round", category: "Funding" },
        { date: "2021-06", title: "Private beta", category: "Product" },
      ],
    });
    const colors = await frame.locator(".tl-swatch").evaluateAll((elements) => elements.map((element) => getComputedStyle(element).backgroundColor));
    assert.equal(new Set(colors).size, 2, "categories use distinct colors");
    const funding = frame.getByRole("button", { name: "Funding", exact: true });
    assert.equal(await funding.getAttribute("aria-pressed"), "true");
    await funding.click();
    assert.equal(await funding.getAttribute("aria-pressed"), "false");
    assert.deepEqual(await frame.locator(".tl-event-title").allTextContents(), ["Private beta", "Public launch"]);
    assert.equal(await frame.getByText("Seed round", { exact: true }).count(), 0);
  },
};

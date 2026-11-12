const CONFIG = { tileTemplate: "https://tiles.test/{z}/{x}/{y}.png", attribution: "Test tiles" };
const TILE_PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
const serveTiles = (page) => page.route("https://tiles.test/**", (route) => route.fulfill({ status: 200, contentType: "image/png", body: TILE_PNG }));
const titles = (scope) => scope.locator(".it-title").evaluateAll((nodes) => nodes.map((n) => n.textContent.replace(/^[\d:–]+ /, "")));
const contexts = async (events) => (await events()).filter((e) => e.modelContext).map((e) => e.modelContext.content[0]?.text ?? null);
const lastMessage = async (events) => (await events()).filter((e) => e.message).pop()?.message.content[0].text;
const byName = (examples, name) => examples.find((e) => e.name === name).data;
const dayOf = (frame, n) => frame.getByRole("region", { name: new RegExp(`^Day ${n}`) });

export default {
  async "shows the first day in order and switches days"({ render, examples, assert }) {
    const frame = await render(byName(examples, "Kyoto city break"), { config: CONFIG });
    await frame.locator(".it-stop").first().waitFor();
    assert.equal(await frame.locator(".it-day").count(), 1);
    assert.deepEqual(await titles(frame), ["Check in at Hotel Kanra", "Nishiki Market", "Gion evening walk"]);
    assert.match(await frame.locator(".it-stop").nth(1).textContent(), /↓ 12 min by subway/);
    assert.match(await frame.locator(".it-stop").nth(1).textContent(), /16:30–17:45 Nishiki Market/);

    await frame.getByRole("button", { name: /^Day 3/ }).click();
    assert.deepEqual(await titles(frame), ["Fushimi Inari Shrine", "Kyoto Railway Museum", "Shinkansen to Tokyo"]);
    await frame.getByRole("button", { name: "All days" }).click();
    assert.equal(await frame.locator(".it-day").count(), 3);
    assert.equal(await frame.locator(".it-stop").count(), 10);
  },

  async "sums costs per currency without converting"({ render, examples, assert }) {
    const frame = await render(byName(examples, "Kyoto city break"), { config: CONFIG });
    await frame.getByRole("button", { name: /^Day 3/ }).click();
    assert.equal(await frame.locator(".it-total").first().textContent(), "Day total: ¥3,000 + A$280");
    assert.equal(await frame.locator(".it-trip").textContent(), "Trip total: ¥15,600 + A$280");
    const two = await render({ days: [{ stops: [{ title: "A", cost: { amount: 3000, currency: "JPY" } }, { title: "B", cost: { amount: 1500, currency: "JPY" } }, { title: "C", cost: { amount: 20, currency: "AUD" } }] }] });
    assert.equal(await two.locator(".it-total").textContent(), "Day total: ¥4,500 + A$20");
  },

  async "renders a titles-only plan without map, cost or calendar"({ render, examples, assert }) {
    const frame = await render(byName(examples, "Titles-only weekend"), { config: CONFIG });
    await frame.locator(".it-stop").first().waitFor();
    assert.equal(await frame.locator(".it-day").textContent(), "Day 1");
    assert.deepEqual(await titles(frame), ["Farmers market", "Picnic by the river", "Movie night"]);
    assert.equal(await frame.locator(".mv-map, .it-total").count(), 0);
    assert.equal(await frame.getByRole("button", { name: "Add to calendar" }).count(), 0);
  },

  async "numbers the day's pins in stop order and links them to the list"({ render, examples, assert, page }) {
    await serveTiles(page);
    const frame = await render(byName(examples, "Family road trip"), { config: CONFIG });
    await frame.locator(".mv-tile").first().waitFor({ timeout: 5000 });
    assert.deepEqual(await frame.locator(".mv-pin-tag").allTextContents(), ["1", "2", "3"], "the motel has no coordinates and gets no pin");
    assert.equal(await frame.locator(".it-pick").count(), 4);

    const left = () => frame.locator(".mv-pin").nth(1).evaluate((el) => parseFloat(el.style.left));
    await frame.getByRole("button", { name: "Show Lunch in Lorne on the map" }).click();
    await page.waitForTimeout(150);
    assert.equal(await frame.locator(".mv-pin").nth(1).getAttribute("aria-pressed"), "true");
    const width = await frame.locator(".mv-map").evaluate((el) => el.clientWidth);
    assert.ok(Math.abs((await left()) - width / 2) < 1, "the map centers on the selected stop");

    await frame.locator(".mv-pin").first().click();
    assert.equal(await frame.locator(".it-on .it-title").textContent(), "10:00 Bells Beach lookout");
    assert.equal(await frame.locator("svg, path, line").count(), 0, "no route is drawn");
  },

  async "hides the map for a day without coordinates, and falls back to the grid when tiles are blocked"({ render, examples, assert, page }) {
    await page.route("https://tiles.test/**", (route) => route.abort());
    const frame = await render(byName(examples, "Kyoto city break"), { config: CONFIG });
    await frame.locator(".mv-grid").waitFor({ timeout: 5000 });
    assert.equal(await frame.locator(".mv-pin").count(), 3);
    const single = await render(byName(examples, "Single day"), { config: CONFIG });
    await single.locator(".it-stop").first().waitFor();
    assert.equal(await single.locator(".mv-map").count(), 0);
  },

  async "moves, removes and undoes with the keyboard"({ render, examples, assert, page }) {
    const frame = await render(byName(examples, "Kyoto city break"), { config: CONFIG });
    const later = frame.getByRole("button", { name: "Move Check in at Hotel Kanra later" });
    await later.focus();
    await page.keyboard.press("Enter");
    assert.deepEqual(await titles(frame), ["Nishiki Market", "Check in at Hotel Kanra", "Gion evening walk"]);
    assert.equal(await frame.locator(".it-stop").nth(1).getByText("Time may need updating").count(), 1);
    assert.equal(await frame.getByRole("button", { name: "Move Nishiki Market earlier" }).isDisabled(), true);

    const moveDay = frame.getByRole("combobox", { name: "Move Gion evening walk to another day" });
    await moveDay.focus();
    await moveDay.selectOption("1");
    assert.deepEqual(await titles(frame), ["Nishiki Market", "Check in at Hotel Kanra"]);
    await frame.getByRole("button", { name: "All days" }).click();
    assert.deepEqual((await titles(dayOf(frame, 2))).slice(-1), ["Gion evening walk"], "it lands at the end of day 2");
    assert.equal(await dayOf(frame, 2).getByText("Time may need updating").count(), 1);

    const remove = frame.getByRole("button", { name: "Remove Bamboo Grove" });
    await remove.focus();
    await page.keyboard.press("Enter");
    assert.equal(await frame.getByText("Bamboo Grove").count(), 0);
    await frame.getByRole("button", { name: "Undo" }).click();
    assert.deepEqual((await titles(dayOf(frame, 2)))[0], "Bamboo Grove", "undo returns it to its day and position");
    await frame.getByRole("button", { name: "Undo" }).click();
    await frame.getByRole("button", { name: "Undo" }).click();
    assert.deepEqual(await titles(dayOf(frame, 1)), ["Check in at Hotel Kanra", "Nishiki Market", "Gion evening walk"]);
    assert.equal(await frame.getByRole("button", { name: "Undo" }).count(), 0);
    assert.equal(await frame.getByText("Time may need updating").count(), 0);
  },

  async "reports the whole new order to the model and sends the edits"({ render, examples, events, assert, page }) {
    const frame = await render(byName(examples, "Family road trip"), { config: CONFIG });
    await frame.getByRole("button", { name: "Move Bells Beach lookout later" }).click();
    await frame.getByRole("button", { name: "Remove Kennett River koala walk" }).click();
    await page.waitForTimeout(150);
    const ctx = await contexts(events);
    assert.equal(ctx.length, 2);
    assert.match(ctx[1], /Great Ocean Road in two days/);
    assert.match(ctx[1], /Day 1: Melbourne to Apollo Bay: 1\. 12:15 Lunch in Lorne; 2\. 10:00 Bells Beach lookout; 3\. Apollo Bay motel/);
    assert.match(ctx[1], /Day 2: Apollo Bay to Port Campbell: 1\. 09:30 Cape Otway Lightstation/, "unchanged days are included");

    await frame.getByRole("button", { name: "Send changes (2)" }).click();
    await page.waitForTimeout(150);
    const text = await lastMessage(events);
    assert.match(text, /- Moved "Bells Beach lookout" later on Day 1/);
    assert.match(text, /- Removed "Kennett River koala walk" from Day 1/);
    assert.match(text, /Current order:\nDay 1/);
  },

  async "offers only Send changes when the host cannot update model context"({ render, examples, events, assert, page }) {
    const frame = await render(byName(examples, "Family road trip"), { config: CONFIG, capabilities: { openLinks: {}, message: { text: {} } } });
    await frame.getByRole("button", { name: /^Day 2/ }).click();
    await frame.getByRole("button", { name: "Remove Loch Ard Gorge" }).click();
    await page.waitForTimeout(150);
    assert.equal((await contexts(events)).length, 0);
    assert.equal(await frame.getByRole("button", { name: "Send changes (1)" }).isEnabled(), true);
    assert.equal(await frame.getByRole("button", { name: "Add to calendar" }).count(), 0, "no downloads, no calendar action");
  },

  async "downloads an .ics with one event per timed stop on a dated day"({ render, examples, events, assert, page }) {
    const frame = await render(byName(examples, "Kyoto city break"), { config: CONFIG });
    await frame.getByRole("button", { name: "Add to calendar" }).click();
    await page.waitForTimeout(150);
    const file = (await events()).find((e) => e.download)?.download.contents[0].resource;
    assert.equal(file.uri, "file:///Three-days-in-Kyoto-with-kids.ics");
    assert.equal(file.mimeType, "text/calendar");
    assert.equal(file.text.match(/BEGIN:VEVENT/g).length, 10);
    assert.match(file.text, /DTSTART:20260312T163000\r\nDTEND:20260312T174500\r\nSUMMARY:Nishiki Market/);

    const undated = await render(byName(examples, "Family road trip"), { config: CONFIG });
    await undated.locator(".it-stop").first().waitFor();
    assert.equal(await undated.getByRole("button", { name: "Add to calendar" }).count(), 0, "timed stops without dates cannot be exported");
  },
};

const CONFIG = { tileTemplate: "https://tiles.test/{z}/{x}/{y}.png", attribution: "Test tiles" };
const TILE_PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
const names = (frame) => frame.locator(".pg-name").allInnerTexts();
const links = async (events) => (await events()).filter((e) => e.openLink).map((e) => e.openLink);
const message = async (events) => (await events()).filter((e) => e.message).pop()?.message.content[0].text;
const byName = (examples, name) => examples.find((e) => e.name === name).data;

export default {
  async "labels cards by kind and formats price, distance and start"({ render, examples, assert }) {
    let frame = await render(byName(examples, "Hotels"));
    const first = frame.locator(".pg-card").first();
    assert.match(await first.locator(".pg-price").textContent(), /^from A\$210 per night$/);
    assert.match(await first.textContent(), /0\.2 mi from Shibuya station/);
    assert.equal(await first.getByRole("button", { name: "Open Shibuya Stream Hotel at site" }).textContent(), "Book at site");

    frame = await render(byName(examples, "Plumbers"));
    assert.equal(await frame.getByRole("button", { name: "Open Harris Park Plumbing at site" }).textContent(), "Visit website");
    assert.match(await frame.locator(".pg-card").first().locator(".pg-price").textContent(), /^from A\$95 per hour$/);

    frame = await render(byName(examples, "Weekend events"));
    assert.match(await frame.locator(".ls-start").first().textContent(), /Nov 14, 2026/);
    assert.equal(await frame.locator(".ls-start").count(), 4);
  },

  async "renders a title-only listing with no empty slots or actions"({ render, assert }) {
    const frame = await render({ listings: [{ title: "Corner Hardware" }] });
    const card = frame.locator(".pg-card");
    await card.waitFor();
    assert.equal((await card.innerText()).replace(/\s+/g, " ").trim(), "C Corner Hardware Shortlist");
    assert.equal(await card.getByRole("button").count(), 0);
    assert.equal(await frame.locator(".pg-price, .pg-rating, .ls-phone, .ls-note").count(), 0);
    assert.equal(await frame.getByRole("combobox").count(), 0, "nothing to sort by");
  },

  async "sorts by rating, distance and price with missing values last"({ render, examples, assert }) {
    const frame = await render(byName(examples, "Plumbers"));
    const sort = frame.getByRole("combobox");
    await sort.selectOption("distance");
    assert.deepEqual(await names(frame), ["Parramatta Emergency Plumbers", "Harris Park Plumbing", "Westmead Tap & Drain", "North Rocks Gasfitting"]);
    await sort.selectOption("rating");
    assert.deepEqual((await names(frame))[0], "North Rocks Gasfitting");
    await sort.selectOption("price");
    assert.deepEqual(await names(frame), ["Harris Park Plumbing", "Westmead Tap & Drain", "Parramatta Emergency Plumbers", "North Rocks Gasfitting"]);
  },

  async "does not offer price sorting when units or currencies differ"({ render, assert }) {
    const mixed = {
      kind: "stay",
      listings: [
        { title: "Per night", price: { amount: 200, currency: "AUD" }, rating: 4 },
        { title: "Whole stay", price: { amount: 540, currency: "AUD", unit: "total" }, rating: 5 },
      ],
    };
    const frame = await render(mixed);
    assert.deepEqual(await frame.locator("option").allTextContents(), ["Best match", "Rating"]);
    const same = await render({ ...mixed, listings: mixed.listings.map((l) => ({ ...l, price: { amount: l.price.amount, currency: "AUD" } })) });
    assert.deepEqual(await same.locator("option").allTextContents(), ["Best match", "Rating", "Price: low to high"]);
  },

  async "opens the site, dials and gets directions through the host"({ render, examples, events, assert, page }) {
    const frame = await render(byName(examples, "Plumbers"));
    await frame.getByRole("button", { name: "Open Harris Park Plumbing at site" }).click();
    await frame.getByRole("button", { name: "Call Harris Park Plumbing" }).click();
    await frame.getByRole("button", { name: "Directions to Harris Park Plumbing" }).click();
    await frame.getByRole("button", { name: "Directions to Parramatta Emergency Plumbers" }).click();
    await page.waitForTimeout(150);
    assert.deepEqual(await links(events), [
      "https://example.com/harris-park-plumbing",
      "tel:0295550142",
      `https://www.openstreetmap.org/search?query=${encodeURIComponent("Harris Park Plumbing -33.8229,151.0089")}`,
      `https://www.openstreetmap.org/search?query=${encodeURIComponent("88 Church St, Parramatta NSW 2150")}`,
    ]);
    assert.equal(await frame.getByRole("button", { name: "Open Westmead Tap & Drain at site" }).count(), 0, "no link, no open action");
    assert.equal(await frame.getByRole("button", { name: /book|pay|cart|quote/i }).count(), 0);
  },

  async "keeps the phone number visible and copyable"({ render, examples, assert, page }) {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    const frame = await render(byName(examples, "Plumbers"));
    assert.match(await frame.locator(".ls-phone").first().textContent(), /\(02\) 9555 0142/);
    await frame.getByRole("button", { name: "Copy phone number of Harris Park Plumbing" }).click();
    await frame.getByRole("button", { name: "Copy phone number of Harris Park Plumbing" }).filter({ hasText: "Copied" }).waitFor();
  },

  async "shortlists, asks and compares"({ render, examples, events, assert, page }) {
    const frame = await render(byName(examples, "Hotels"));
    const ask = frame.getByRole("button", { name: /Ask about selected/ });
    const compare = frame.getByRole("button", { name: "Compare selected" });
    assert.equal(await ask.isDisabled(), true);
    await frame.getByRole("checkbox", { name: "Shortlist Hotel Koe Tokyo" }).check();
    assert.equal(await compare.isDisabled(), true, "one listing cannot be compared");
    await ask.click();
    await page.waitForTimeout(150);
    assert.equal(await message(events), "Tell me more about these:\n- Hotel Koe Tokyo (https://example.com/stay/koe)");
    await frame.getByRole("checkbox", { name: "Shortlist Trunk Hotel Cat Street" }).check();
    await frame.getByRole("checkbox", { name: "Shortlist Sakura Fleur Aoyama" }).check();
    await compare.click();
    await page.waitForTimeout(150);
    const text = await message(events);
    assert.match(text, /^Compare these and recommend one:/);
    for (const name of ["Hotel Koe Tokyo", "Trunk Hotel Cat Street", "Sakura Fleur Aoyama"]) assert.ok(text.includes(name), name);
  },

  async "switches to a map with price pins and keeps the selection"({ render, examples, assert, page }) {
    const requests = [];
    await page.route("https://tiles.test/**", async (route) => {
      requests.push(route.request().url());
      await route.fulfill({ status: 200, contentType: "image/png", body: TILE_PNG });
    });
    const frame = await render(byName(examples, "Hotels"), { config: CONFIG });
    await frame.getByRole("checkbox", { name: "Shortlist Hotel Koe Tokyo" }).check();
    assert.equal(requests.length, 0, "no tiles before the map is opened");
    await frame.getByRole("button", { name: "Map", exact: true }).click();
    await frame.locator(".mv-tile").first().waitFor({ timeout: 5000 });
    assert.equal(await frame.locator(".mv-pin").count(), 4);
    assert.deepEqual(await frame.locator(".mv-pin-tag").allTextContents(), ["A$210", "A$245", "A$168", "A$390"]);
    assert.equal((await frame.locator(".mv-count").textContent()).trim(), "1 not on map");
    for (const url of requests) assert.match(url, /^https:\/\/tiles\.test\/\d+\/\d+\/\d+\.png$/);
    assert.equal(await frame.locator('.mv-pin[aria-pressed="true"]').count(), 1, "the shortlisted listing is selected on the map");
    assert.deepEqual(await names(frame), ["Hotel Koe Tokyo"]);

    await frame.locator(".mv-pin").nth(3).click();
    assert.deepEqual(await names(frame), ["Trunk Hotel Cat Street"]);
    await frame.getByRole("button", { name: "Grid", exact: true }).click();
    assert.equal(await frame.getByRole("checkbox", { name: "Shortlist Trunk Hotel Cat Street" }).isChecked(), true);
    assert.equal(await frame.getByRole("checkbox", { name: "Shortlist Hotel Koe Tokyo" }).isChecked(), true);
  },

  async "falls back to the grid pattern when tiles are blocked, and hides the toggle without coordinates"({ render, examples, assert, page }) {
    await page.route("https://tiles.test/**", (route) => route.abort());
    let frame = await render(byName(examples, "Hotels"), { config: CONFIG });
    await frame.getByRole("button", { name: "Map", exact: true }).click();
    await frame.locator(".mv-grid").waitFor({ timeout: 5000 });
    assert.equal(await frame.locator(".mv-pin").count(), 4);
    frame = await render({ listings: [{ title: "A", lat: 1, lng: 1 }, { title: "B" }] }, { config: CONFIG });
    await frame.locator(".pg-card").first().waitFor();
    assert.equal(await frame.getByRole("button", { name: "Map", exact: true }).count(), 0);
  },

  async "shows the snapshot notice, and the opening state only while it is fresh"({ render, assert }) {
    const listing = { title: "Tap Shop", openNow: true, hours: "7am to 5pm", price: { amount: 80, currency: "AUD", unit: "hour" } };
    const now = new Date().toISOString();
    let frame = await render({ asOf: now, listings: [listing], source: { name: "Booking.com" } });
    assert.match(await frame.locator(".ls-note").textContent(), /^Prices and details checked .+\. Check the final price at the site\.$/);
    assert.match(await frame.locator(".ink-source").textContent(), /Booking\.com/);
    assert.equal(await frame.getByText("Open now").count(), 1);

    frame = await render({ asOf: new Date(Date.now() - 2 * 86400_000).toISOString(), listings: [listing] });
    await frame.locator(".ls-note").waitFor();
    assert.equal(await frame.getByText("Open now").count(), 0, "a 2-day-old opening state is hidden");
    assert.match(await frame.locator(".pg-card").textContent(), /7am to 5pm/);

    frame = await render({ listings: [{ ...listing, price: undefined }] });
    await frame.locator(".pg-card").waitFor();
    assert.equal(await frame.locator(".ls-note").count(), 0, "no price, no snapshot notice");
    assert.equal(await frame.getByText("Open now").count(), 0, "no asOf, no opening state");
  },
};

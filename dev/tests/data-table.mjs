export default {
  async "sorts a number column both ways"({ render, examples, assert }) {
    const frame = await render(examples[0].data);
    const firstCompany = () => frame.locator("tbody tr").first().locator("td").nth(1).innerText();
    await frame.getByRole("button", { name: /Employees/ }).click();
    assert.equal(await firstCompany(), "Klim");
    await frame.getByRole("button", { name: /Employees/ }).click();
    assert.equal(await firstCompany(), "Enpal");
  },
  async "filters rows by text"({ render, examples, assert }) {
    const frame = await render(examples[0].data);
    await frame.getByRole("searchbox", { name: "Filter rows" }).fill("series");
    assert.equal(await frame.locator("tbody tr").count(), 3);
  },
  async "sends selected rows to the agent"({ render, examples, events, assert, page }) {
    const frame = await render(examples[0].data);
    await frame.getByRole("checkbox", { name: "Select row 2" }).check();
    await frame.getByRole("checkbox", { name: "Select row 3" }).check();
    await frame.getByRole("button", { name: "Ask about selected (2)" }).click();
    await page.waitForTimeout(200);
    const msg = (await events()).find((e) => e.message)?.message.content[0].text;
    assert.match(msg, /2 rows/);
    assert.match(msg, /1Komma5°/);
    assert.match(msg, /Ecoligo/);
  },
  async "downloads visible rows as CSV"({ render, examples, events, assert, page }) {
    const frame = await render(examples[0].data);
    await frame.getByRole("searchbox", { name: "Filter rows" }).fill("series");
    await frame.getByRole("button", { name: "Download CSV" }).click();
    await page.waitForTimeout(200);
    const res = (await events()).find((e) => e.download).download.contents[0].resource;
    assert.equal(res.mimeType, "text/csv");
    const lines = res.text.split("\n");
    assert.equal(lines.length, 4);
    assert.match(lines[0], /^Company,Stage,Funding/);
  },
  async "hides CSV when the host has no downloads"({ render, examples, assert }) {
    const frame = await render(examples[0].data, { capabilities: { openLinks: {}, message: { text: {} } } });
    await frame.locator("table").waitFor();
    assert.equal(await frame.getByRole("button", { name: "Download CSV" }).count(), 0);
  },
  async "draws journeys with stops, day offset and duration only when known"({ render, examples, assert }) {
    const frame = await render(examples.find((e) => e.name === "Flights with prices").data);
    const cell = (row) => frame.locator("tbody tr").nth(row).locator(".jr");
    assert.equal(await cell(0).locator(".ink-sr").textContent(), "SYD 10:20 → HND 17:55 · Direct · 9h 35m · Qantas");
    assert.equal(await cell(0).locator(".jr-more").textContent(), "Direct · 9h 35m · Qantas");
    assert.match(await cell(1).locator(".jr-times").textContent(), /09:15 SYD → 07:40\+1 NRT/);
    assert.equal(await cell(1).locator(".jr-more").textContent(), "1 stop SIN 9h 30m · 24h 25m · Singapore Airlines");
    assert.equal(await cell(2).locator(".jr-more").textContent(), "1 stop CNS 3h 20m · 13h 30m · Jetstar", "durationMinutes is shown as passed");
    assert.equal(await cell(3).locator(".jr-more").textContent(), "1 stop HKG 3h 5m · Cathay Pacific", "no offsets and no duration, so no total");
  },
  async "sorts journeys by duration with unknown last, and filters by carrier and flight number"({ render, examples, assert }) {
    const frame = await render(examples.find((e) => e.name === "Flights with prices").data);
    const airlines = () => frame.locator("tbody tr td:nth-child(2)").allInnerTexts();
    await frame.getByRole("button", { name: /Route/ }).click();
    assert.deepEqual(await airlines(), ["Qantas", "Jetstar", "Singapore Airlines", "Cathay Pacific"]);
    await frame.getByRole("searchbox", { name: "Filter rows" }).fill("jetstar");
    assert.deepEqual(await airlines(), ["Jetstar"]);
    await frame.getByRole("searchbox", { name: "Filter rows" }).fill("sq638");
    assert.deepEqual(await airlines(), ["Singapore Airlines"]);
    await frame.getByRole("searchbox", { name: "Filter rows" }).fill("HKG");
    assert.deepEqual(await airlines(), ["Cathay Pacific"]);
  },
  async "writes journeys as one line in the CSV and in Ask about selected"({ render, examples, events, assert, page }) {
    const frame = await render(examples.find((e) => e.name === "Flights with prices").data);
    await frame.getByRole("button", { name: "Download CSV" }).click();
    await frame.getByRole("checkbox", { name: "Select row 1" }).check();
    await frame.getByRole("button", { name: "Ask about selected (1)" }).click();
    await page.waitForTimeout(200);
    const all = await events();
    const csv = all.find((e) => e.download).download.contents[0].resource.text.split("\n");
    assert.equal(csv[0], "Airline,Route,Price,Bags,Book");
    assert.match(csv[1], /^Qantas,SYD 10:20 → HND 17:55 · Direct · 9h 35m · Qantas,/);
    assert.match(all.find((e) => e.message).message.content[0].text, /Route: SYD 10:20 → HND 17:55 · Direct · 9h 35m · Qantas/);
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

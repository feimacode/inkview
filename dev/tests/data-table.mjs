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
};

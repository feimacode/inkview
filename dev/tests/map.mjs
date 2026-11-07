const TILE_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);
const CONFIG = { tileTemplate: "https://tiles.test/{z}/{x}/{y}.png", attribution: "Test tiles" };
const TILE = /^https:\/\/tiles\.test\/(\d+)\/(\d+)\/(\d+)\.png$/;

const serveTiles = async (page, requests = []) =>
  page.route("https://tiles.test/**", async (route) => {
    requests.push(route.request().url());
    await route.fulfill({ status: 200, contentType: "image/png", body: TILE_PNG });
  });

const blockers = (page) => page.route("https://tiles.test/**", (route) => route.abort());

const zoomOf = async (frame) => {
  const src = await frame.locator(".mv-tile").first().getAttribute("src");
  return Number(src.match(TILE)[1]);
};

export default {
  async "requests only tile coordinates and fits every place"({ render, examples, assert, page }) {
    const requests = [];
    await serveTiles(page, requests);
    const frame = await render(examples[0].data, { config: CONFIG });
    await frame.locator(".mv-tile").first().waitFor({ timeout: 5000 });

    assert.ok(requests.length > 0, "tiles were requested");
    for (const url of requests) assert.match(url, TILE, `unexpected tile URL ${url}`);
    const srcs = await frame.locator(".mv-tile").evaluateAll((nodes) => nodes.map((n) => n.getAttribute("src")));
    for (const src of srcs) assert.match(src, TILE, `unexpected tile URL ${src}`);
    assert.equal(new Set(srcs).size, srcs.length, "no duplicate tiles");

    await frame.locator(".mv-pin").first().waitFor();
    const inside = await frame.locator(".mv-map").evaluate((map) => {
      const box = map.getBoundingClientRect();
      return [...map.querySelectorAll(".mv-pin")].every((pin) => {
        const pinBox = pin.getBoundingClientRect();
        return pinBox.left >= box.left && pinBox.right <= box.right && pinBox.top >= box.top && pinBox.bottom <= box.bottom;
      });
    });
    assert.ok(inside, "every pin is inside the map after fitting");
  },

  async "zooms with the keyboard and pans with the arrow keys"({ render, examples, assert, page }) {
    await serveTiles(page);
    const frame = await render(examples[0].data, { config: CONFIG });
    await frame.locator(".mv-tile").first().waitFor({ timeout: 5000 });

    const map = frame.getByRole("application");
    await map.focus();
    const before = await zoomOf(frame);
    await page.keyboard.press("=");
    await page.waitForTimeout(150);
    assert.equal(await zoomOf(frame), before + 1, "plus zooms in one level");
    await page.keyboard.press("-");
    await page.waitForTimeout(150);
    assert.equal(await zoomOf(frame), before, "minus zooms back out");

    const left = () => frame.locator(".mv-pin").first().evaluate((el) => parseFloat(el.style.left));
    const start = await left();
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(150);
    assert.ok((await left()) < start, "ArrowRight moves the view east, so pins move left");
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(150);
    assert.ok(Math.abs((await left()) - start) < 0.5, "ArrowLeft returns to the same place");
  },

  async "selects from the list and from a pin"({ render, examples, assert }) {
    const frame = await render(examples[0].data, { config: CONFIG });
    await frame.locator(".mv-pin").first().waitFor();

    const reffen = frame.locator(".mv-item").filter({ hasText: "Reffen" });
    await reffen.click();
    await frame.locator(".mv-detail-title").waitFor();
    assert.equal(await frame.locator(".mv-detail-title").textContent(), "Reffen");
    assert.equal(await reffen.getAttribute("aria-pressed"), "true");
    assert.match(await frame.locator(".mv-coords").textContent(), /55\.6905, 12\.6047/);
    assert.equal(await frame.locator('.mv-pin[aria-label="Reffen, 55.6905, 12.6047"]').getAttribute("aria-pressed"), "true");

    await frame.locator(".mv-pin").nth(2).click();
    await frame.locator(".mv-detail-title").filter({ hasText: "Gasoline Grill" }).waitFor();
    assert.equal(await frame.locator(".mv-item").filter({ hasText: "Gasoline Grill" }).getAttribute("aria-pressed"), "true");
    assert.equal(await reffen.getAttribute("aria-pressed"), "true", "selecting another place keeps the first selected");

    const gasolinePin = frame.locator('.mv-pin[aria-label="Gasoline Grill, 55.6784, 12.5772"]');
    await gasolinePin.click();
    await frame.locator(".mv-detail-title").filter({ hasText: "Reffen" }).waitFor();
    assert.equal(await gasolinePin.getAttribute("aria-pressed"), "false", "clicking a selected pin deselects it");
    assert.equal(await reffen.getAttribute("aria-pressed"), "true");
  },

  async "opens maps and asks about the selected places"({ render, examples, events, assert, page }) {
    const frame = await render(examples[0].data, { config: CONFIG });
    await frame.locator(".mv-pin").first().waitFor();

    await frame.locator(".mv-item").filter({ hasText: "Noma" }).click();
    await frame.getByRole("button", { name: "Open in maps" }).click();
    await page.waitForTimeout(150);
    const query = encodeURIComponent("Noma 55.6833,12.6103");
    const opened = (await events()).find((e) => e.openLink);
    assert.equal(opened?.openLink, `https://www.openstreetmap.org/search?query=${query}`);

    await frame.locator(".mv-item").filter({ hasText: "Reffen" }).click();
    await frame.getByRole("button", { name: "Ask about selected" }).click();
    await page.waitForTimeout(150);
    const message = (await events()).find((e) => e.message)?.message.content[0].text;
    assert.match(
      message,
      /^Tell me about Noma at Refshalevej 96, 1432 Copenhagen \(55\.6833, 12\.6103\); Reffen at Refshalevej 167A, 1432 Copenhagen \(55\.6905, 12\.6047\)\.$/,
    );
    assert.equal(await frame.getByRole("button", { name: "Ask about selected" }).isEnabled(), true);
  },

  async "falls back to the neutral grid when tiles are blocked"({ render, examples, assert, page }) {
    await blockers(page);
    const frame = await render(examples[0].data, { config: CONFIG });
    await frame.locator(".mv-grid").waitFor({ timeout: 5000 });
    assert.equal(await frame.locator(".mv-tile").count(), 0, "failed tiles are removed");
    assert.equal(await frame.locator(".mv-attrib").textContent(), "Test tiles");
    assert.ok((await frame.locator(".mv-pin").count()) === examples[0].data.places.length, "pins still show");
  },
};

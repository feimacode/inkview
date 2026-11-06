const items = [
  { title: "Book venue", status: "To do", owner: "Priya" },
  { title: "Send invites", status: "In progress" },
  { title: "Draft agenda", status: "Done" },
];

const contextText = async (events) => (await events()).filter((e) => e.modelContext).map((e) => e.modelContext.content[0].text);
const lastMessage = async (events) => (await events()).find((e) => e.message)?.message.content[0].text;

export default {
  async "groups items by status and switches between checklist and board"({ render, assert }) {
    const frame = await render({ title: "Launch", items });
    await frame.locator(".tk-group").first().waitFor();
    assert.deepEqual(await frame.locator(".tk-group-title").allTextContents(), ["To do 1", "In progress 1", "Done 1"]);
    assert.deepEqual(await frame.locator(".tk-item-title").allTextContents(), ["Book venue", "Send invites", "Draft agenda"]);

    await frame.getByRole("button", { name: "Board", exact: true }).click();
    assert.equal(await frame.locator(".tk-col").count(), 3);
    assert.deepEqual(await frame.locator(".tk-col-title").allTextContents(), ["To do 1", "In progress 1", "Done 1"]);
    assert.deepEqual(await frame.locator(".tk-item-title").allTextContents(), ["Book venue", "Send invites", "Draft agenda"]);

    await frame.getByRole("button", { name: "Checklist", exact: true }).click();
    assert.equal(await frame.locator(".tk-group").count(), 3);
  },

  async "checks an item off and reports the change to the model"({ render, events, page, assert }) {
    const frame = await render({ title: "Launch", items });
    const checkbox = frame.getByRole("checkbox", { name: 'Mark "Book venue" as done' });
    assert.equal(await checkbox.isChecked(), false);
    await checkbox.click();
    assert.equal(await checkbox.isChecked(), true);
    assert.equal(await frame.getByRole("combobox", { name: 'Status of "Book venue"' }).inputValue(), "Done");
    assert.equal(await frame.locator(".tk-group").nth(2).locator(".tk-item-title").allTextContents().then((t) => t.includes("Book venue")), true);

    await page.waitForTimeout(100);
    const ctx = await contextText(events);
    assert.equal(ctx.length, 1);
    assert.match(ctx[0], /Book venue: Done/);
    assert.doesNotMatch(ctx[0], /Send invites/);

    const send = frame.getByRole("button", { name: "Send changes (1)", exact: true });
    assert.equal(await send.isEnabled(), true);
    await send.click();
    await page.waitForTimeout(100);
    assert.match(await lastMessage(events), /Book venue: Done/);
  },

  async "moves an item with the keyboard only"({ render, events, page, assert }) {
    const frame = await render({ items });
    const select = frame.getByRole("combobox", { name: 'Status of "Book venue"' });
    await select.focus();
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(100);
    assert.equal(await select.inputValue(), "In progress");
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(100);
    assert.equal(await select.inputValue(), "Done");

    const ctx = await contextText(events);
    assert.equal(ctx.length, 2);
    assert.equal(ctx.at(-1).split("\n").at(-1), "- Book venue: Done");

    const doneGroup = frame.locator('.tk-group[aria-label="Done"]');
    assert.equal(await doneGroup.locator(".tk-item-title").allTextContents().then((t) => t.includes("Book venue")), true);
  },

  async "without model-context support only Send changes is offered"({ render, events, page, assert }) {
    const frame = await render({ items }, { capabilities: { openLinks: {}, message: { text: {} } } });
    await frame.getByRole("checkbox", { name: 'Mark "Send invites" as done' }).click();
    await page.waitForTimeout(100);
    assert.equal((await events()).some((e) => e.modelContext), false);

    const send = frame.getByRole("button", { name: "Send changes (1)", exact: true });
    assert.equal(await send.isEnabled(), true);
    await send.click();
    await page.waitForTimeout(100);
    assert.match(await lastMessage(events), /Send invites: Done/);
  },

  async "marks past-due items overdue and labels priority in text"({ render, assert }) {
    const frame = await render({
      items: [
        { title: "Book venue", status: "To do", due: "2020-01-01", priority: "high" },
        { title: "Draft agenda", status: "Done", due: "2020-01-01" },
      ],
    });
    await frame.locator(".tk-item").first().waitFor();
    assert.equal(await frame.getByText("Overdue", { exact: true }).count(), 1);
    assert.equal(await frame.getByText("High priority", { exact: true }).count(), 1);
    assert.equal(await frame.locator('time[datetime="2020-01-01"]').count(), 2);
    const todo = frame.locator('.tk-group[aria-label="To do"]');
    assert.equal(await todo.getByText("Overdue", { exact: true }).count(), 1);
  },

  async "board scrolls inside the card at 320 px"({ render, page, examples, assert }) {
    await page.setViewportSize({ width: 352, height: 900 });
    const frame = await render(examples[1].data);
    await frame.locator(".tk-group").first().waitFor();
    await frame.getByRole("button", { name: "Board", exact: true }).click();
    const overflow = await frame.locator("body").evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 0, `document overflows by ${overflow}px`);
    const scrolls = await frame.locator(".tk-board").evaluate((el) => el.scrollWidth > el.clientWidth);
    assert.ok(scrolls, "board scrolls horizontally inside its container");
  },
};

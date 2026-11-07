export default {
  async "email header shows kind, title and To, Cc and Subject above the body"({ render, examples, assert }) {
    const frame = await render(examples[0].data);
    await frame.locator(".dp-body .dp-p").first().waitFor();
    assert.equal(await frame.locator(".dp-kind").textContent(), "Email");
    assert.equal(await frame.getByRole("heading", { name: "Follow-up on the renewal" }).count(), 1);
    assert.deepEqual(await frame.locator(".dp-meta dt").allTextContents(), ["To", "Cc", "Subject"]);
    assert.deepEqual(await frame.locator(".dp-meta dd").allTextContents(), [
      "marcus.bell@northwind.example.com",
      "priya@ledgerly.example.com",
      "Re: Q4 renewal",
    ]);
    const head = await frame.locator(".dp-head").boundingBox();
    const body = await frame.locator(".dp-body").boundingBox();
    assert.ok(head.y < body.y, "the header sits above the body");
    assert.equal(await frame.locator(".dp-body li").count(), 3);
  },

  async "post header shows platform and account, and links open through the host"({ render, events, examples, assert, page }) {
    const frame = await render(examples[1].data);
    await frame.locator(".dp-body .dp-p").first().waitFor();
    assert.equal(await frame.locator(".dp-kind").textContent(), "Post");
    assert.deepEqual(await frame.locator(".dp-meta dt").allTextContents(), ["Platform", "Account"]);
    assert.deepEqual(await frame.locator(".dp-meta dd").allTextContents(), ["LinkedIn", "@inkview"]);
    await frame.getByRole("button", { name: "Read the launch note" }).click();
    // The host bridge records the link asynchronously; wait for it like the other link checks do.
    await page.waitForTimeout(200);
    assert.ok((await events()).some((event) => event.openLink === "https://example.com/launch"));
  },

  async "report renders its kind, headings, table, quote and rule"({ render, examples, assert }) {
    const frame = await render(examples[2].data);
    await frame.locator(".dp-body").waitFor();
    assert.equal(await frame.locator(".dp-kind").textContent(), "Report");
    assert.deepEqual(await frame.locator(".dp-body .dp-h").allTextContents(), ["Highlights", "Risks", "Next week"]);
    assert.deepEqual(await frame.locator(".dp-table th").allTextContents(), ["Metric", "Before", "After"]);
    assert.equal(await frame.locator(".dp-table tbody tr").count(), 3);
    assert.equal(await frame.locator(".dp-quote").count(), 1);
    assert.equal(await frame.locator(".dp-hr").count(), 1);
  },

  async "edits the body and approves the edited text"({ render, events, page, examples, assert }) {
    const frame = await render(examples[0].data);
    await frame.getByRole("button", { name: "Edit", exact: true }).click();
    const editor = frame.getByRole("textbox", { name: "Draft body" });
    assert.equal(await editor.inputValue(), examples[0].data.body);
    await editor.fill("Hi Marcus,\n\nUpdated terms are in the attached note.");
    assert.equal(await frame.locator(".dp-body").count(), 0);

    await frame.getByRole("button", { name: "Done", exact: true }).click();
    const body = frame.locator(".dp-body");
    await body.waitFor();
    assert.match(await body.textContent(), /Updated terms are in the attached note/);
    assert.doesNotMatch(await body.textContent(), /Thanks for the call/);

    await frame.getByRole("button", { name: "Approve", exact: true }).click();
    await page.waitForTimeout(100);
    const message = (await events()).find((event) => event.message)?.message.content[0].text;
    assert.match(message, /^Approved: send this email/);
    assert.match(message, /Follow-up on the renewal/);
    assert.match(message, /Updated terms are in the attached note\./);
    assert.doesNotMatch(message, /Thanks for the call/);
  },

  async "copy is hidden when the clipboard is unavailable, and confirms otherwise"({ render, page, examples, assert }) {
    const frame = await render(examples[0].data);
    await frame.locator(".dp-actions").waitFor();
    const available = await frame.locator("body").evaluate(() => typeof navigator.clipboard?.writeText === "function");
    if (!available) {
      assert.equal(await frame.getByRole("button", { name: "Copy", exact: true }).count(), 0);
      return;
    }
    await frame.getByRole("button", { name: "Copy", exact: true }).click();
    await page.waitForTimeout(300);
    const copied = await frame.getByText("Copied", { exact: true }).count();
    const stillOffered = await frame.getByRole("button", { name: "Copy", exact: true }).count();
    assert.ok(copied === 1 || stillOffered === 0, "copy confirms or hides after a clipboard failure");
  },
  async "shows word and character counts and marks a body over the limit"({ render, examples, assert }) {
    const under = await render({ ...examples[1].data, body: "one two" });
    await under.locator(".dp-count").waitFor();
    assert.deepEqual(await under.locator(".dp-count > span").allTextContents(), [
      "7 characters",
      "2 words",
      "273 characters left",
    ]);

    const over = await render({ ...examples[1].data, body: "x".repeat(300) });
    await over.locator(".dp-count").waitFor();
    assert.deepEqual(await over.locator(".dp-count > span").allTextContents(), [
      "300 characters",
      "1 word",
      "20 over the limit",
    ]);
    assert.equal(await over.locator(".dp-count-over").count(), 2);
    const color = await over.locator(".dp-count > span").first().evaluate((el) => getComputedStyle(el).color);
    const muted = await over.locator(".dp-count > span").nth(1).evaluate((el) => getComputedStyle(el).color);
    assert.notEqual(color, muted, "the over-limit count is marked");
  },
};

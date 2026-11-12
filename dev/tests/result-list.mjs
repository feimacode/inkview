export default {
  async "opens a result and digs deeper"({ render, examples, events, assert, page }) {
    const frame = await render(examples[0].data);
    await frame.getByRole("button", { name: "MCP Apps in ChatGPT", exact: true }).click();
    await frame.getByRole("button", { name: "Dig deeper: Getting started with MCP Apps in Claude" }).click();
    await page.waitForTimeout(200);
    const ev = await events();
    assert.ok(ev.some((e) => e.openLink === "https://developers.openai.com/apps-sdk/mcp-apps-in-chatgpt/"));
    assert.match(ev.find((e) => e.message).message.content[0].text, /Getting started with MCP Apps in Claude/);
  },
  async "shows the domain when there is no source"({ render, assert }) {
    const frame = await render({ results: [{ title: "Example", url: "https://www.example.org/x" }] });
    await frame.getByText("example.org").waitFor();
    assert.ok(true);
  },
  async "copy link sits beside open, and item sources show in the footer"({ render, assert, page }) {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    const info = { name: "Example Docs", url: "https://docs.example.org", retrievedAt: new Date(Date.now() - 2 * 3_600_000).toISOString() };
    const frame = await render({ results: [{ title: "Example", url: "https://www.example.org/x", source: "example.org", sourceInfo: info, snippet: "From memory.", unverified: ["snippet"] }, { title: "Other", url: "https://other.example/y", source: "Other" }] });
    await frame.getByRole("button", { name: "Copy link of Example" }).click();
    await frame.getByText("Copied").waitFor();
    assert.equal(await frame.locator(".ink-source").textContent(), "Source: Example Docs · checked 2 hours ago ◦ = not checked against a source");
    assert.equal(await frame.getByRole("img", { name: "not checked" }).count(), 1);
  },
  async "has no footer when no item carries source details"({ render, assert }) {
    const frame = await render({ results: [{ title: "Example", url: "https://www.example.org/x", source: "example.org" }] });
    await frame.getByText("Example", { exact: true }).waitFor();
    assert.equal(await frame.locator(".ink-source").count(), 0);
  },
};

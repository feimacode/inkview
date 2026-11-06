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
};

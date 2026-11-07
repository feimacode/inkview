// End-to-end smoke test: start the HTTP server, then act as an MCP client.
// MCP_URL=http://host:port/mcp tests a running server instead (e.g. the Docker image).
import { spawn } from "node:child_process";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

const PORT = process.env.PORT ?? "3999";
const MCP_URL = process.env.MCP_URL ?? `http://localhost:${PORT}/mcp`;
const srv = process.env.MCP_URL
  ? null
  : spawn(process.execPath, ["dist/inkview.js", "--http"], { env: { ...process.env, PORT, INKVIEW_LOG: "off" }, stdio: ["ignore", "pipe", "inherit"] });
if (srv) await new Promise((resolve) => srv.stdout.on("data", (d) => String(d).includes("listening") && resolve()));

try {
  const client = new Client({ name: "smoke", version: "0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(MCP_URL)));

  const { tools } = await client.listTools();
  const tool = tools.find((t) => t.name === "show_profile_card");
  assert.ok(tool, "show_profile_card is listed");
  const uri = tool._meta?.ui?.resourceUri;
  assert.equal(uri, "ui://inkview/v1/app.html", "tools share the v1 resource");
  console.log("✓ tools/list:", tool.name, "→", uri);

  const res = await client.callTool({
    name: "show_profile_card",
    arguments: {
      name: "Ada Lovelace",
      headline: "Mathematician, first computer programmer",
      location: "London, UK",
      tags: ["Analytical Engine", "Mathematics"],
      profileUrl: "https://en.wikipedia.org/wiki/Ada_Lovelace",
      somethingUnknown: "is accepted",
    },
  });
  assert.equal(res.isError ?? false, false);
  assert.equal(res.structuredContent.component, "profile_card");
  assert.equal(res.structuredContent.data.name, "Ada Lovelace");
  assert.match(res.content[0].text, /### Ada Lovelace/);
  console.log("✓ tools/call: structuredContent + markdown fallback");

  const bad = await client.callTool({ name: "show_profile_card", arguments: { headline: "no name" } });
  assert.equal(bad.isError, true, "missing name is rejected");
  console.log("✓ tools/call rejects invalid input");

  const timeline = await client.callTool({
    name: "show_timeline",
    arguments: {
      title: "Northstar",
      events: [
        { date: "2020-04", title: "First release" },
        { date: "2019", title: "Founded" },
        { date: "2020-04-12", title: "First customer" },
      ],
    },
  });
  assert.equal(timeline.isError ?? false, false);
  assert.equal(timeline.structuredContent.component, "timeline");
  assert.match(timeline.content[0].text, /- 2019: Founded[\s\S]*- 2020-04: First release/);
  const badTimeline = await client.callTool({
    name: "show_timeline",
    arguments: { events: [{ date: "sometime in spring", title: "Launch" }] },
  });
  assert.equal(badTimeline.isError, true, "unreadable timeline date is rejected");
  assert.match(badTimeline.content[0].text, /YYYY-MM-DD, YYYY-MM or YYYY/);
  console.log("✓ show_timeline: valid payload and invalid date");

  const tasks = await client.callTool({
    name: "show_tasks",
    arguments: {
      title: "Launch",
      items: [
        { title: "Book venue", status: "To do", owner: "Priya", due: "2026-11-03" },
        { title: "Send invites", status: "In progress" },
        { title: "Draft agenda", status: "Done" },
      ],
    },
  });
  assert.equal(tasks.isError ?? false, false);
  assert.equal(tasks.structuredContent.component, "task_list");
  assert.match(tasks.content[0].text, /#### To do\n- \[ \] Book venue — Priya · due 2026-11-03[\s\S]*#### Done\n- \[x\] Draft agenda/);
  const badTasks = await client.callTool({
    name: "show_tasks",
    arguments: { items: [{ title: "Book venue", status: "Blocked" }] },
  });
  assert.equal(badTasks.isError, true, "unknown status is rejected");
  assert.match(badTasks.content[0].text, /not one of: To do, In progress, Done/);
  console.log("✓ show_tasks: valid payload and unknown status");

  const doc = await client.callTool({
    name: "show_document",
    arguments: {
      kind: "email",
      title: "Renewal follow-up",
      meta: { to: "marcus@example.com", subject: "Re: renewal" },
      body: "Hi Marcus,\n\nThanks for the call.",
    },
  });
  assert.equal(doc.isError ?? false, false);
  assert.equal(doc.structuredContent.component, "document_preview");
  assert.ok(
    doc.content[0].text.includes("### Renewal follow-up\n\n- **To:** marcus@example.com\n- **Subject:** Re: renewal\n\nHi Marcus,\n\nThanks for the call."),
    doc.content[0].text,
  );
  const badDoc = await client.callTool({ name: "show_document", arguments: { body: "x".repeat(20001) } });
  assert.equal(badDoc.isError, true, "body over 20,000 characters is rejected");
  assert.match(badDoc.content[0].text, /20,000/);
  console.log("✓ show_document: valid payload and over-long body");

  const formTool = tools.find((t) => t.name === "show_form");
  assert.ok(formTool, "show_form is listed");
  assert.match(formTool.description, /3 or more inputs are missing/);
  const form = await client.callTool({
    name: "show_form",
    arguments: {
      title: "Trip details",
      fields: [
        { name: "destination", label: "Destination", type: "text", required: true },
        { name: "travel", label: "Travel", type: "select", options: ["Train", "Plane", "Car"] },
        { name: "travelers", label: "Travelers", type: "number", min: 1, max: 8 },
        { name: "contact", label: "Contact", type: "email", required: true },
      ],
    },
  });
  assert.equal(form.isError ?? false, false);
  assert.equal(form.structuredContent.component, "form");
  assert.ok(form.content[0].text.includes("1. **Destination** (required) — text."), form.content[0].text);
  assert.ok(form.content[0].text.includes("2. **Travel** — one of: Train, Plane, Car."), form.content[0].text);
  assert.match(form.content[0].text, /Reply in chat with your answers\.$/);

  const badOptions = await client.callTool({
    name: "show_form",
    arguments: { fields: [{ name: "travel", label: "Travel", type: "select" }] },
  });
  assert.equal(badOptions.isError, true, "a select without options is rejected");
  assert.match(badOptions.content[0].text, /Travel.*needs options/);

  const badSecret = await client.callTool({
    name: "show_form",
    arguments: { fields: [{ name: "password", label: "Password", type: "text" }] },
  });
  assert.equal(badSecret.isError, true, "a secret field is rejected");
  assert.match(badSecret.content[0].text, /cannot collect secrets/);
  console.log("✓ show_form: valid payload, missing options and secret field");

  // Every component: each example renders, its markdown is non-empty, and an empty payload is rejected.
  const dirs = readdirSync("src/components", { withFileTypes: true }).filter((d) => d.isDirectory());
  for (const d of dirs) {
    const metaSrc = readFileSync(`src/components/${d.name}/meta.ts`, "utf8");
    const toolName = metaSrc.match(/tool:\s*"([^"]+)"/)[1];
    const component = metaSrc.match(/component:\s*"([^"]+)"/)[1];
    const t = tools.find((x) => x.name === toolName);
    assert.ok(t, `${toolName} is listed`);
    assert.equal(t._meta?.ui?.resourceUri, "ui://inkview/v1/app.html");
    assert.equal(t.annotations?.readOnlyHint, true);
    const examples = JSON.parse(readFileSync(`src/components/${d.name}/examples.json`, "utf8"));
    for (const ex of examples) {
      const r = await client.callTool({ name: toolName, arguments: ex.data });
      assert.ok(!r.isError, `${toolName} "${ex.name}": ${r.content?.[0]?.text}`);
      assert.equal(r.structuredContent.component, component);
      assert.ok(r.content[0].text.length > 0);
    }
    const bad = await client.callTool({ name: toolName, arguments: {} });
    assert.equal(bad.isError, true, `${toolName} rejects an empty payload`);
    console.log(`✓ ${toolName}: ${examples.length} examples, invalid input rejected`);
  }

  const autoCases = [
    { name: "table", data: [{ city: "Oslo", population: 709000 }, { city: "Bergen", population: 291000 }, { city: "Trondheim", population: 212000 }], component: "data_table", tool: "show_table" },
    { name: "profile", data: { name: "Ada Lovelace", title: "Mathematician", company: "Analytical Engines" }, component: "profile_card", tool: "show_profile_card" },
    { name: "no match", data: "just a sentence", component: "text" },
  ];
  for (const c of autoCases) {
    const r = await client.callTool({ name: "show_auto", arguments: { data: c.data } });
    assert.ok(!r.isError, `show_auto ${c.name}: ${r.content?.[0]?.text}`);
    assert.equal(r.structuredContent.component, c.component, `show_auto ${c.name} picks ${c.component}`);
    if (c.tool) assert.ok(r.content[0].text.includes(c.tool), `show_auto ${c.name} names ${c.tool}`);
  }
  console.log("✓ show_auto: table, profile and no-match data");

  const init = client.getInstructions?.() ?? "";
  for (const t of tools) assert.ok(init.includes(t.name), `instructions mention ${t.name}`);
  console.log("✓ initialize instructions name every tool");

  const rr = await client.readResource({ uri });
  const item = rr.contents[0];
  assert.equal(item.mimeType, "text/html;profile=mcp-app");
  assert.ok(item.text.includes("<div id=\"root\">"));
  assert.ok(item._meta?.ui?.csp?.resourceDomains?.length > 0);
  console.log(`✓ resources/read: ${(item.text.length / 1024).toFixed(0)} KB HTML, CSP declared`);
  await client.close();
  console.log("All smoke tests passed.");
} finally {
  srv?.kill();
}

import { test } from "node:test";
import assert from "node:assert/strict";
import { httpUrl } from "../../src/components/fields.js";
import { serverComponents } from "../../src/components/server-registry.js";
import { deriveActions, mdActions, MAX_VISIBLE } from "../../src/runtime/handoff.js";
import { canOpen, openSafely, telUrl } from "../../src/runtime/links.js";

const get = (id: string) => serverComponents.find((c) => c.meta.component === id)!;

test("httpUrl accepts http and https and rejects script, data and relative URLs", () => {
  for (const ok of ["https://example.com/a?b=1", "http://example.com"]) assert.equal(httpUrl.safeParse(ok).success, true, ok);
  for (const bad of ["javascript:alert(1)", "data:text/html,<script>alert(1)</script>", "tel:0295550142", "ftp://example.com/x", "/relative", "example.com"]) {
    assert.equal(httpUrl.safeParse(bad).success, false, bad);
  }
});

test("a script URL in any component's link field is rejected, naming the field", () => {
  const listing = get("listings").schema.safeParse({ listings: [{ title: "x", url: "javascript:alert(1)" }] });
  assert.equal(listing.success, false);
  assert.deepEqual(listing.error!.issues[0].path, ["listings", 0, "url"]);
  assert.equal(get("product_grid").schema.safeParse({ products: [{ title: "x", url: "data:text/html,x" }] }).success, false);
  assert.equal(get("entity_card").schema.safeParse({ name: "x", websiteUrl: "javascript:void(0)" }).success, false);
  assert.equal(get("result_list").schema.safeParse({ results: [{ title: "x", url: "javascript:void(0)" }] }).success, false);
  assert.equal(get("profile_card").schema.safeParse({ name: "x", profileUrl: "javascript:void(0)" }).success, false);
  assert.equal(get("chart").schema.safeParse({ kind: "bar", x: ["a"], series: [{ name: "s", values: [1] }], source: { name: "s", url: "javascript:void(0)" } }).success, false);
  assert.equal(get("chart").schema.safeParse({ kind: "bar", x: ["a"], series: [{ name: "s", values: [1] }], source: { name: "s", url: "https://s.io" } }).success, true);
});

test("canOpen allows web, phone and mail links only", () => {
  for (const ok of ["https://a.io", "http://a.io", "tel:+61295550142", "mailto:a@b.io"]) assert.equal(canOpen(ok), true, ok);
  for (const bad of ["javascript:alert(1)", "data:text/html,x", "file:///etc/passwd", "blob:https://a.io/1", "vbscript:x", "not a url", ""]) assert.equal(canOpen(bad), false, bad);
});

test("openSafely falls back to a window for https and does nothing for a refused scheme", async () => {
  const windows: string[] = [];
  const hosts: string[] = [];
  const refuse = (u: string) => (hosts.push(u), Promise.reject(new Error("host said no")));
  openSafely("https://a.io/x", refuse, (u) => windows.push(u));
  openSafely("javascript:alert(1)", refuse, (u) => windows.push(u));
  openSafely("data:text/html,x", refuse, (u) => windows.push(u));
  await new Promise((r) => setTimeout(r, 0));
  assert.deepEqual(hosts, ["https://a.io/x"], "unsafe links never reach the host");
  assert.deepEqual(windows, ["https://a.io/x"], "and never reach the window fallback");

  const accepted: string[] = [];
  openSafely("tel:0295550142", (u) => (accepted.push(u), Promise.resolve()), (u) => windows.push(u));
  await new Promise((r) => setTimeout(r, 0));
  assert.deepEqual(accepted, ["tel:0295550142"]);
  assert.equal(windows.length, 1, "no window when the host accepts");
});

test("deriveActions: only from passed fields, primary first, calendar needs downloads", () => {
  const full = { title: "Jazz at the Basement", url: "https://example.com/jazz", phone: "(02) 9555 0142", address: "7 Macquarie Pl, Sydney", start: "2026-12-05T19:30" };
  const all = deriveActions(full, { canDownload: true, copy: ["phone", "address", "link"] });
  assert.deepEqual(all.map((a) => a.kind === "copy" ? `copy-${a.field}` : a.kind), ["open", "call", "directions", "calendar", "copy-phone", "copy-address", "copy-link"]);
  assert.deepEqual(all.slice(0, MAX_VISIBLE).map((a) => a.label), ["Open at site", "Call", "Directions"]);
  assert.equal(all[1].kind === "call" && all[1].url, "tel:0295550142");

  assert.deepEqual(deriveActions(full, { canDownload: false }).map((a) => a.kind), ["open", "call", "directions"], "no downloads, no calendar");
  assert.deepEqual(deriveActions({ title: "Bare" }, { canDownload: true, copy: ["phone", "address", "link"] }), [], "no field, no action");
  assert.deepEqual(deriveActions({ title: "Phone only", phone: "0400 555 019" }, { canDownload: true }).map((a) => a.kind), ["call"]);
  assert.deepEqual(deriveActions({ title: "Pin", lat: -33.8, lng: 151.2 }, { canDownload: true }).map((a) => a.kind), ["directions"]);
  assert.deepEqual(deriveActions(full, { canDownload: true, skip: ["open"] }).map((a) => a.kind), ["call", "directions", "calendar"]);
  assert.equal(deriveActions(full, { canDownload: true, openLabel: "View at store" })[0].label, "View at store");
  assert.equal(deriveActions({ title: "x", start: "next Friday" }, { canDownload: true }).length, 0, "a start that is not a date gives no calendar action");
  for (const a of all) assert.doesNotMatch(a.label, /book|reserve|pay|checkout|cart|quote/i);
});

test("the calendar action builds an .ics that starts at the event's time", () => {
  const cal = deriveActions({ title: "Jazz at the Basement", address: "7 Macquarie Pl, Sydney", start: "2026-12-05T19:30", url: "https://example.com/jazz" }, { canDownload: true }).find((a) => a.kind === "calendar");
  assert.ok(cal && cal.kind === "calendar");
  assert.equal(cal.filename, "Jazz-at-the-Basement.ics");
  const ics = cal.ics();
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /DTSTART:20261205T193000\r\nDTEND:20261205T203000\r\nSUMMARY:Jazz at the Basement/);
  assert.match(ics, /LOCATION:7 Macquarie Pl\\, Sydney/);
  assert.equal(ics.match(/BEGIN:VEVENT/g)!.length, 1);

  const allDay = deriveActions({ title: "Fair", start: "2026-12-05" }, { canDownload: true })[0];
  assert.ok(allDay.kind === "calendar");
  assert.match(allDay.ics(), /DTSTART;VALUE=DATE:20261205/);
});

test("mdActions lists the site, a tel link and a directions link", () => {
  assert.equal(
    mdActions({ title: "Harris Park Plumbing", url: "https://example.com/hpp", phone: "(02) 9555 0142", address: "12 Marion St" }),
    "[Open at site](https://example.com/hpp) · [(02) 9555 0142](tel:0295550142) · [Directions](https://www.openstreetmap.org/search?query=12%20Marion%20St)",
  );
  assert.equal(mdActions({ title: "x", url: "https://a.io", phone: "0400 555 019" }, { skipOpen: true }), "[0400 555 019](tel:0400555019)");
  assert.equal(mdActions({ title: "x", phone: "0400 555 019", unverified: ["phone"] }), "[0400 555 019](tel:0400555019) (not checked)");
  assert.equal(mdActions({ title: "x" }), "");
  assert.equal(telUrl("+61 (2) 9555-0142"), "tel:+61295550142");
});

test("entity card markdown: phone as a tel link and a Directions map link", () => {
  const c = get("entity_card");
  const md = c.toMarkdown(c.schema.parse({ name: "Harris Park Plumbing", kind: "place", phone: "(02) 9555 0142", address: "12 Marion St, Harris Park", websiteUrl: "https://example.com/hpp", unverified: ["phone"] }));
  assert.match(md, /\[Website\]\(https:\/\/example\.com\/hpp\)/);
  assert.match(md, /\n12 Marion St, Harris Park\n/);
  assert.match(md, /\[\(02\) 9555 0142\]\(tel:0295550142\) \(not checked\) · \[Directions\]\(https:\/\/www\.openstreetmap\.org\/search\?query=12%20Marion%20St%2C%20Harris%20Park\)/);
  assert.match(md, /_No source given_$/);
  assert.equal(c.schema.safeParse({ name: "x", phone: "call me maybe" }).success, false, "an unsafe phone value is rejected");
});

test("comparison markdown links each option's site", () => {
  const c = get("comparison");
  const md = c.toMarkdown(c.schema.parse({ items: [{ name: "A", url: "https://a.io" }, { name: "B" }], criteria: ["Price"], values: [["$1"], ["$2"]] }));
  assert.match(md, /\[A\]\(https:\/\/a\.io\)/);
});

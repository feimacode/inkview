import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { serverComponents } from "../../src/components/server-registry.js";
import { toIcs } from "../../src/components/itinerary/format.js";

const dirs = readdirSync("src/components", { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);

for (const dir of dirs) {
  const examples = JSON.parse(readFileSync(`src/components/${dir}/examples.json`, "utf8")) as { name: string; data: unknown }[];
  const metaSrc = readFileSync(`src/components/${dir}/meta.ts`, "utf8");
  const id = metaSrc.match(/component:\s*"([^"]+)"/)![1];
  const c = serverComponents.find((x) => x.meta.component === id)!;
  test(`${dir}: every example validates and has a markdown fallback`, () => {
    assert.ok(examples.length >= 3, "at least 3 examples");
    for (const ex of examples) {
      const data = c.schema.parse(ex.data);
      const md = c.toMarkdown(data);
      assert.ok(md.trim().length > 0, ex.name);
      assert.ok(!md.includes("undefined"), `${ex.name}: no "undefined" in markdown`);
    }
  });
}

const esc = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const get = (id: string) => serverComponents.find((c) => c.meta.component === id)!;

test("profile card markdown: name heading, links, minimal", () => {
  const c = get("profile_card");
  assert.equal(c.toMarkdown(c.schema.parse({ name: "Ada" })), "### Ada");
  assert.match(c.toMarkdown(c.schema.parse({ name: "Ada", profileUrl: "https://x.org" })), /\[Profile\]\(https:\/\/x\.org\)/);
});

test("profile grid markdown: numbered people with headlines and profile links", () => {
  const c = get("profile_grid");
  assert.equal(
    c.toMarkdown(
      c.schema.parse({
        title: "Speakers",
        caption: "Top 2 of 9",
        people: [
          { name: "Mira Hoffmann", headline: "Staff Engineer", profileUrl: "https://x.io/mira" },
          { name: "Ada" },
        ],
      }),
    ),
    "### Speakers\n\n_Top 2 of 9_\n\n1. **Mira Hoffmann** — Staff Engineer — [Profile](https://x.io/mira)\n2. **Ada**",
  );
  assert.equal(c.toMarkdown(c.schema.parse({ people: [{ name: "Ada" }, { name: "Grace" }] })), "1. **Ada**\n2. **Grace**");
});

test("profile grid rejects fewer than 2 and more than 24 people", () => {
  const c = get("profile_grid");
  const one = c.schema.safeParse({ people: [{ name: "Ada" }] });
  assert.equal(one.success, false);
  assert.match(JSON.stringify(one.error!.issues), /at least 2 people/);
  const many = c.schema.safeParse({ people: Array.from({ length: 25 }, (_, i) => ({ name: `P ${i}` })) });
  assert.equal(many.success, false);
  assert.match(JSON.stringify(many.error!.issues), /at most 24 people/);
});

test("table markdown is a pipe table with caption and escaped pipes", () => {
  const c = get("data_table");
  const md = c.toMarkdown(
    c.schema.parse({ columns: [{ key: "a", label: "A" }, { key: "l", label: "L", type: "link" }], rows: [{ a: "x|y", l: { label: "Site", url: "https://s.io" } }], caption: "1 of 9" }),
  );
  assert.match(md, /^\| A \| L \|\n\| --- \| --- \|\n\| x\\\|y \| \[Site\]\(https:\/\/s\.io\) \|/);
  assert.match(md, /_1 of 9_/);
});

test("table rejects 51 rows with a helpful message", () => {
  const r = get("data_table").schema.safeParse({ columns: [{ key: "a", label: "A" }], rows: Array.from({ length: 51 }, (_, i) => ({ a: i })) });
  assert.equal(r.success, false);
  assert.match(JSON.stringify(r.error!.issues), /at most 50 rows/);
});

test("table rejects an unknown column type", () => {
  assert.equal(get("data_table").schema.safeParse({ columns: [{ key: "a", label: "A", type: "emoji" }], rows: [{ a: 1 }] }).success, false);
});

test("result list markdown is a numbered list of links", () => {
  const c = get("result_list");
  assert.equal(c.toMarkdown(c.schema.parse({ results: [{ title: "T", url: "https://t.io" }] })), "1. [T](https://t.io)");
  assert.equal(c.schema.safeParse({ results: Array.from({ length: 21 }, () => ({ title: "t", url: "https://t.io" })) }).success, false);
});

test("entity card markdown lists facts", () => {
  const c = get("entity_card");
  assert.match(c.toMarkdown(c.schema.parse({ name: "Acme", facts: [{ label: "Founded", value: "1999" }] })), /- \*\*Founded:\*\* 1999/);
});

test("comparison markdown: criteria rows, items columns, recommendation", () => {
  const c = get("comparison");
  const md = c.toMarkdown(c.schema.parse({ items: [{ name: "A" }, { name: "B" }], criteria: ["X"], values: [[true], [{ rating: 3 }]], recommended: "B", reason: "Cheaper" }));
  assert.match(md, /\|  \| A \| B ★ \|/);
  assert.match(md, /\| X \| Yes \| 3\/5 \|/);
  assert.match(md, /\*\*Recommended: B\*\*\. Cheaper/);
  assert.equal(c.schema.safeParse({ items: [{ name: "A" }], criteria: ["X"], values: [[1]] }).success, false);
});

test("chart rejects mismatched lengths and names the series", () => {
  const r = get("chart").schema.safeParse({ kind: "line", x: ["a", "b", "c"], series: [{ name: "Revenue", values: [1, 2] }] });
  assert.equal(r.success, false);
  assert.match(JSON.stringify(r.error!.issues), /Series \\"Revenue\\" has 2 values but x has 3/);
});

test("chart markdown starts with a summary and has a data table", () => {
  const c = get("chart");
  const md = c.toMarkdown(c.schema.parse({ kind: "bar", x: ["a", "b"], series: [{ name: "S", values: [1, 5] }], unit: "ms" }));
  assert.match(md, /^Bar chart over 2 points \(a to b\): S from 1 ms to 5 ms\./);
  assert.match(md, /\| a \| 1 \|/);
});

test("product grid markdown has prices and store links; no more than 12", () => {
  const c = get("product_grid");
  assert.equal(
    c.toMarkdown(c.schema.parse({ products: [{ title: "Tee", url: "https://s.io/tee", price: 9.5, currency: "USD", rating: 4.5, reviewCount: 10 }] })),
    "1. [Tee](https://s.io/tee) — $9.50 · ★ 4.5 (10)\n\n_No source given_",
  );
  assert.equal(c.schema.safeParse({ products: Array.from({ length: 13 }, () => ({ title: "t", url: "https://t.io" })) }).success, false);
});

test("timeline markdown: full and minimal payloads", () => {
  const c = get("timeline");
  assert.equal(
    c.toMarkdown(
      c.schema.parse({
        title: "Northstar",
        caption: "2 of 7 events",
        events: [
          { date: "2020-04", title: "First release", detail: "Opened to everyone.", url: "https://example.com/release", category: "Product" },
          { date: "2019", title: "Founded" },
        ],
        source: { name: "Press kit", url: "https://example.com/press" },
      }),
    ),
    "### Northstar\n\n- 2019: Founded\n- 2020-04: [First release](https://example.com/release) · Product\n  Opened to everyone.\n\n_2 of 7 events_\n\n_Source: [Press kit](https://example.com/press)_",
  );
  assert.equal(c.toMarkdown(c.schema.parse({ events: [{ date: "2024", title: "Founded" }] })), "- 2024: Founded");
});

test("task list markdown: grouped checklist with full and minimal payloads", () => {
  const c = get("task_list");
  assert.equal(
    c.toMarkdown(
      c.schema.parse({
        title: "Launch",
        items: [
          { title: "Send invites", status: "In progress", owner: "Sam" },
          { title: "Book venue", status: "To do", due: "2026-11-03", url: "https://example.com/venue" },
          { title: "Draft agenda", status: "Done" },
        ],
        source: { name: "Tracker", url: "https://example.com/tracker" },
      }),
    ),
    "### Launch\n\n#### To do\n- [ ] [Book venue](https://example.com/venue) — due 2026-11-03\n\n#### In progress\n- [ ] Send invites — Sam\n\n#### Done\n- [x] Draft agenda\n\n_Source: [Tracker](https://example.com/tracker)_",
  );
  assert.equal(c.toMarkdown(c.schema.parse({ items: [{ title: "Book venue", status: "To do" }] })), "#### To do\n- [ ] Book venue");
});

test("task list markdown checks off the last custom status and skips empty groups", () => {
  const c = get("task_list");
  const md = c.toMarkdown(
    c.schema.parse({ statuses: ["Backlog", "Shipped"], items: [{ title: "Offline drafts", status: "Shipped" }] }),
  );
  assert.equal(md, "#### Shipped\n- [x] Offline drafts");
});

test("task list rejects an unknown status, a bad due date and 51 items", () => {
  const c = get("task_list");
  const unknown = c.schema.safeParse({ items: [{ title: "Book venue", status: "Blocked" }] });
  assert.equal(unknown.success, false);
  assert.match(JSON.stringify(unknown.error!.issues), /not one of: To do, In progress, Done/);
  assert.equal(c.schema.safeParse({ items: [{ title: "Book venue", status: "To do", due: "next friday" }] }).success, false);
  const tooMany = c.schema.safeParse({ items: Array.from({ length: 51 }, (_, i) => ({ title: `Task ${i}`, status: "To do" })) });
  assert.equal(tooMany.success, false);
  assert.match(JSON.stringify(tooMany.error!.issues), /50 most relevant items/);
});

test("timeline markdown orders mixed date precision and validates input limits", () => {
  const c = get("timeline");
  const data = c.schema.parse({
    events: [
      { date: "2019-04-12", title: "Series A" },
      { date: "2019-01", title: "Prototype" },
      { date: "2019", title: "Founded" },
    ],
  });
  assert.equal(c.toMarkdown(data), "- 2019: Founded\n- 2019-01: Prototype\n- 2019-04-12: Series A");
  const invalidDate = c.schema.safeParse({ events: [{ date: "sometime in spring", title: "Launch" }] });
  assert.equal(invalidDate.success, false);
  assert.match(JSON.stringify(invalidDate.error!.issues), /YYYY-MM-DD, YYYY-MM or YYYY/);
  const tooMany = c.schema.safeParse({ events: Array.from({ length: 51 }, (_, i) => ({ date: "2024", title: `Event ${i}` })) });
  assert.equal(tooMany.success, false);
  assert.match(JSON.stringify(tooMany.error!.issues), /50 most relevant events.*caption/);
});

test("document markdown: email header and minimal fallback", () => {
  const c = get("document_preview");
  assert.equal(
    c.toMarkdown(
      c.schema.parse({
        kind: "email",
        title: "Renewal",
        meta: { to: "marcus@example.com", cc: "priya@example.com", subject: "Re: renewal" },
        body: "Hi Marcus,\n\nThanks!",
      }),
    ),
    "### Renewal\n\n- **To:** marcus@example.com\n- **Cc:** priya@example.com\n- **Subject:** Re: renewal\n\nHi Marcus,\n\nThanks!",
  );
  assert.equal(c.toMarkdown(c.schema.parse({ body: "Just a note." })), "Just a note.");
});

test("document rejects a body over 20,000 characters, unknown kinds and too much metadata", () => {
  const c = get("document_preview");
  const tooLong = c.schema.safeParse({ body: "x".repeat(20001) });
  assert.equal(tooLong.success, false);
  assert.match(JSON.stringify(tooLong.error!.issues), /20,000/);
  assert.equal(c.schema.safeParse({ kind: "tweet", body: "x" }).success, false);
  const meta = Object.fromEntries(Array.from({ length: 7 }, (_, i) => [`k${i}`, "v"]));
  assert.equal(c.schema.safeParse({ body: "x", meta }).success, false);
});

test("form markdown: full payload with types, help and ranges", () => {
  const c = get("form");
  assert.equal(
    c.toMarkdown(
      c.schema.parse({
        title: "Plan the offsite",
        intro: "A few details and I will draft the options.",
        fields: [
          { name: "destination", label: "Destination", type: "text", help: "City or region", required: true },
          { name: "dates", label: "Preferred date", type: "date", min: "2026-11-15", max: "2026-12-20" },
          { name: "travel", label: "Travel", type: "select", options: ["Train", "Plane", "Car"] },
          { name: "contact", label: "Contact email", type: "email", required: true },
        ],
      }),
    ),
    "### Plan the offsite\n\nA few details and I will draft the options.\n\n1. **Destination** (required) — text. City or region\n2. **Preferred date** — date, YYYY-MM-DD from 2026-11-15 to 2026-12-20.\n3. **Travel** — one of: Train, Plane, Car.\n4. **Contact email** (required) — email address.\n\nReply in chat with your answers.",
  );
});

test("form markdown: minimal payload", () => {
  const c = get("form");
  assert.equal(
    c.toMarkdown(c.schema.parse({ fields: [{ name: "name", label: "Your name", type: "text", required: true }] })),
    "1. **Your name** (required) — text.\n\nReply in chat with your answers.",
  );
});

test("map markdown: numbered places with addresses, links, caption and source", () => {
  const c = get("map");
  assert.equal(
    c.toMarkdown(
      c.schema.parse({
        title: "Dinner in Copenhagen",
        caption: "2 of 9 places",
        places: [
          { label: "Noma", lat: 55.6833, lng: 12.6103, address: "Refshalevej 96", url: "https://noma.dk" },
          { label: "Reffen", lat: 55.6905, lng: 12.6047 },
        ],
        source: { name: "City guide", url: "https://example.com/copenhagen" },
      }),
    ),
    "### Dinner in Copenhagen\n\n1. [Noma](https://noma.dk) — Refshalevej 96 — 55.6833, 12.6103\n2. **Reffen** — 55.6905, 12.6047\n\n_2 of 9 places_\n\n_Source: [City guide](https://example.com/copenhagen)_",
  );
});

test("map markdown: minimal payload is one numbered place", () => {
  const c = get("map");
  assert.equal(c.toMarkdown(c.schema.parse({ places: [{ label: "Office", lat: 59.3346, lng: 18.0633 }] })), "1. **Office** — 59.3346, 18.0633\n\n_No source given_");
  assert.equal(c.toMarkdown(c.schema.parse({ places: [{ label: "Null Island", lat: 0, lng: 0 }] })), "1. **Null Island** — 0, 0\n\n_No source given_");
});

test("map rejects out-of-range coordinates, more than 50 places, a place with no location, half a coordinate and a long pin label", () => {
  const c = get("map");
  const lat = c.schema.safeParse({ places: [{ label: "Noma", lat: 91, lng: 12 }] });
  assert.equal(lat.success, false);
  assert.match(JSON.stringify(lat.error!.issues), /Latitude must be at most 90/);

  const lng = c.schema.safeParse({ places: [{ label: "Noma", lat: 55, lng: -181 }] });
  assert.equal(lng.success, false);
  assert.match(JSON.stringify(lng.error!.issues), /Longitude must be at least -180/);

  const many = c.schema.safeParse({ places: Array.from({ length: 51 }, (_, i) => ({ label: `Place ${i}`, lat: 55, lng: 12 })) });
  assert.equal(many.success, false);
  assert.match(JSON.stringify(many.error!.issues), /50 most relevant places.*caption/);

  const missing = c.schema.safeParse({ places: [{ label: "Somewhere" }] });
  assert.equal(missing.success, false);
  assert.match(JSON.stringify(missing.error!.issues), /needs coordinates \(lat and lng\) or an address/);
  assert.match(JSON.stringify(missing.error!.issues), /does not look up addresses/);

  const half = c.schema.safeParse({ places: [{ label: "Somewhere", lat: 55, address: "Main St 1" }] });
  assert.equal(half.success, false);
  assert.match(JSON.stringify(half.error!.issues), /lng is missing/);

  const long = c.schema.safeParse({ places: [{ label: "Hotel", lat: 55, lng: 12, pinLabel: "$1,234 a night" }] });
  assert.equal(long.success, false);
  assert.match(JSON.stringify(long.error!.issues), /pinLabel must be at most 8 characters/);
});

test("map markdown: places without coordinates keep their address and drop the coordinates", () => {
  const c = get("map");
  assert.equal(
    c.toMarkdown(
      c.schema.parse({
        places: [
          { label: "Harris Park Plumbing", lat: -33.8229, lng: 151.0089, address: "12 Marion St" },
          { label: "Parramatta Emergency Plumbers", address: "88 Church St, Parramatta" },
        ],
      }),
    ),
    "1. **Harris Park Plumbing** — 12 Marion St — -33.8229, 151.0089\n2. **Parramatta Emergency Plumbers** — 88 Church St, Parramatta\n\n_No source given_",
  );
  assert.equal(c.toMarkdown(c.schema.parse({ places: [{ label: "Depot", address: "1 Dock Rd" }] })), "1. **Depot** — 1 Dock Rd\n\n_No source given_");
});

test("form rejects too many fields, missing options, secrets, duplicate names and bad defaults", () => {
  const c = get("form");
  const field = (name: string, extra: Record<string, unknown> = {}) => ({ name, label: name, type: "text", ...extra });

  const tooMany = c.schema.safeParse({ fields: Array.from({ length: 13 }, (_, i) => field(`f${i}`)) });
  assert.equal(tooMany.success, false);
  assert.match(JSON.stringify(tooMany.error!.issues), /at most 12 fields/);

  const noOptions = c.schema.safeParse({ fields: [{ name: "travel", label: "Travel", type: "select" }] });
  assert.equal(noOptions.success, false);
  assert.match(JSON.stringify(noOptions.error!.issues), /Travel.*needs options/);

  const secret = c.schema.safeParse({ fields: [{ name: "password", label: "Password", type: "text" }] });
  assert.equal(secret.success, false);
  assert.match(JSON.stringify(secret.error!.issues), /cannot collect secrets/);

  const duplicate = c.schema.safeParse({ fields: [field("name"), field("name")] });
  assert.equal(duplicate.success, false);
  assert.match(JSON.stringify(duplicate.error!.issues), /used more than once/);

  const badDefault = c.schema.safeParse({ fields: [{ name: "travel", label: "Travel", type: "select", options: ["Train"], default: "Plane" }] });
  assert.equal(badDefault.success, false);
  assert.match(JSON.stringify(badDefault.error!.issues), /default must be one of its options/);
});

test("listings markdown: linked titles, price with unit, rating, distance, address, phone and the as-of line", () => {
  const c = get("listings");
  // The footer says "may have changed" once the check is a day old, so the
  // expected text is anchored on a pattern instead of today's date.
  assert.match(
    c.toMarkdown(
      c.schema.parse({
        title: "Plumbers near Parramatta",
        kind: "service",
        distanceFrom: "from Parramatta station",
        asOf: "2026-11-12T09:30:00+11:00",
        caption: "2 of 14",
        listings: [
          {
            title: "Harris Park Plumbing",
            url: "https://example.com/hpp",
            price: { amount: 95, currency: "AUD", unit: "hour", from: true },
            rating: 4.8,
            reviewCount: 212,
            distanceKm: 1.4,
            address: "12 Marion St",
            phone: "(02) 9555 0142",
            badges: ["Licensed"],
          },
          { title: "Westmead Tap & Drain", phone: "0400 555 019" },
        ],
        source: { name: "Local search" },
      }),
    ),
    new RegExp(
      "^" +
        esc(
          "### Plumbers near Parramatta\n\n1. [Harris Park Plumbing](https://example.com/hpp) — from A$95 per hour · ★ 4.8 (212) · 1.4 km from Parramatta station · 12 Marion St · Licensed · [(02) 9555 0142](tel:0295550142) · [Directions](https://www.openstreetmap.org/search?query=12%20Marion%20St)\n2. **Westmead Tap & Drain** — [0400 555 019](tel:0400555019)\n\n_Prices are a snapshot. Check the final price at the site._\n\n_2 of 14_\n\n_Source: Local search · checked 2026-11-11 22:30 UTC",
        ) +
        "( · may have changed)?_$",
    ),
  );
  assert.equal(c.toMarkdown(c.schema.parse({ listings: [{ title: "Corner Hardware" }] })), "1. **Corner Hardware**\n\n_No source given_");
  assert.match(c.toMarkdown(c.schema.parse({ kind: "stay", listings: [{ title: "Inn", price: { amount: 210, currency: "AUD", from: true } }] })), /from A\$210 per night/);
});

test("listings reject an unsafe phone, half a coordinate, a fifth badge and a 21st listing", () => {
  const c = get("listings");
  const phone = c.schema.safeParse({ listings: [{ title: "Bad", phone: "tel:+61;ext=javascript" }] });
  assert.equal(phone.success, false);
  assert.match(JSON.stringify(phone.error!.issues), /phone may contain only digits/);
  assert.match(JSON.stringify(phone.error!.issues), /"phone"/);
  assert.equal(c.schema.safeParse({ listings: [{ title: "Half", lat: 1 }] }).success, false);
  assert.equal(c.schema.safeParse({ listings: [{ title: "Badges", badges: ["a", "b", "c", "d", "e"] }] }).success, false);
  const many = c.schema.safeParse({ listings: Array.from({ length: 21 }, (_, i) => ({ title: `L${i}` })) });
  assert.equal(many.success, false);
  assert.match(JSON.stringify(many.error!.issues), /20 most relevant listings/);
});

test("itinerary markdown: a heading per day, stops in order with time, travel and cost, and day totals", () => {
  const c = get("itinerary");
  assert.equal(
    c.toMarkdown(
      c.schema.parse({
        title: "Kyoto",
        caption: "Easy pace",
        days: [
          {
            date: "2026-03-12",
            label: "Gion",
            stops: [
              { title: "Nishiki Market", time: "16:30", endTime: "17:45", cost: { amount: 3000, currency: "JPY" }, travel: "12 min by subway", url: "https://example.com/nishiki" },
              { title: "Gion walk", cost: { amount: 20, currency: "AUD" } },
            ],
          },
          { stops: [] },
        ],
        source: { name: "Guide" },
      }),
    ),
    "### Kyoto\n\n#### Day 1: Gion · 2026-03-12\n\n1. 16:30–17:45 [Nishiki Market](https://example.com/nishiki) — 12 min by subway · ¥3,000\n2. **Gion walk** — A$20\n\nDay total: ¥3,000 + A$20\n\n#### Day 2\n\n_No stops yet._\n\n_Easy pace_\n\n_Source: Guide_",
  );
  assert.equal(c.toMarkdown(c.schema.parse({ days: [{ stops: [{ title: "Market" }] }] })), "#### Day 1\n\n1. **Market**\n\n_No source given_");
});

test("itinerary rejects 15 days, 13 stops, a bad time and half a coordinate", () => {
  const c = get("itinerary");
  const days = c.schema.safeParse({ days: Array.from({ length: 15 }, () => ({ stops: [] })) });
  assert.equal(days.success, false);
  assert.match(JSON.stringify(days.error!.issues), /at most 14 days/);
  assert.equal(c.schema.safeParse({ days: [{ stops: Array.from({ length: 13 }, (_, i) => ({ title: `S${i}` })) }] }).success, false);
  assert.equal(c.schema.safeParse({ days: [{ stops: [{ title: "Late", time: "25:00" }] }] }).success, false);
  assert.equal(c.schema.safeParse({ days: [{ stops: [{ title: "Half", lng: 135 }] }] }).success, false);
  assert.equal(c.schema.safeParse({ days: [{ date: "12 March", stops: [] }] }).success, false);
});

test("calendar export: floating local times, 1-hour default, escaping and folding", () => {
  const ics = toIcs(
    [
      {
        date: "2026-03-12",
        stops: [
          { title: "Dinner; sushi, sake", time: "23:30", note: "Line one\nLine two", url: "https://example.com/dinner", address: "1 Gion, Kyoto" },
          { title: "Museum", time: "10:00", endTime: "12:15", lat: 35.0, lng: 135.7 },
          { title: "No time" },
          { title: "É".repeat(60), time: "08:00" },
        ],
      },
      { stops: [{ title: "Undated", time: "09:00" }] },
    ],
    new Date("2026-01-02T03:04:05Z"),
  );
  assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n"));
  assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
  assert.equal(ics.match(/BEGIN:VEVENT/g)!.length, 3, "only timed stops on dated days");
  assert.match(ics, /DTSTAMP:20260102T030405Z/);
  assert.match(ics, /DTSTART:20260312T233000\r\nDTEND:20260313T003000\r\nSUMMARY:Dinner\\; sushi\\, sake\r\nLOCATION:1 Gion\\, Kyoto\r\nDESCRIPTION:Line one\\nLine two\\nhttps:\/\/example.com\/dinner/);
  assert.match(ics, /DTSTART:20260312T100000\r\nDTEND:20260312T121500\r\nSUMMARY:Museum\r\nLOCATION:35\\,135.7/);
  assert.doesNotMatch(ics, /TZID|DTSTART:\d+T\d+Z/, "times are floating");
  for (const line of ics.split("\r\n")) assert.ok(Buffer.byteLength(line) <= 75, `line over 75 octets: ${line}`);
  assert.ok(ics.replace(/\r\n /g, "").includes(`SUMMARY:${"É".repeat(60)}`), "unfolding restores the long line");
});

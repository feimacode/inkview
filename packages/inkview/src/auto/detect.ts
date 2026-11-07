/**
 * show_auto: pick an Inkview component from the shape of arbitrary JSON and
 * map the data into that component's schema. Rules run in a fixed order
 * (products, results, map, timeline, tasks, chart, profile grid, profile,
 * entity, table) and fall back to text.
 */
import { parseTimelineDate } from "../../../../src/components/timeline/date.js";
import { parseIsoDate } from "../../../../src/components/task-list/date.js";

export type AutoComponent =
  | "product_grid"
  | "result_list"
  | "map"
  | "timeline"
  | "task_list"
  | "chart"
  | "profile_grid"
  | "profile_card"
  | "entity_card"
  | "data_table";
export type Detection = { component: AutoComponent; data: Record<string, unknown>; note?: string } | null;

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const num = (v: unknown): number | undefined => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const m = v.replace(/[, ]/g, "").match(/^[^\d-]*(-?\d+(\.\d+)?)/);
    if (m) return Number(m[1]);
  }
  return undefined;
};
const isUrl = (v: unknown) => typeof v === "string" && /^https?:\/\/\S+$/i.test(v);
const pick = (o: Obj, keys: string[]) => {
  for (const k of keys) {
    const hit = Object.keys(o).find((x) => x.toLowerCase() === k.toLowerCase());
    if (hit !== undefined && o[hit] != null && o[hit] !== "") return o[hit];
  }
  return undefined;
};
const isDateLike = (v: unknown) =>
  (typeof v === "string" && /^\d{4}(-\d{2}){0,2}([T ].*)?$/.test(v) && !Number.isNaN(Date.parse(v))) ||
  (typeof v === "string" && /^(Q[1-4]|H[12])\b/i.test(v));
const currencyOf = (v: unknown): string | undefined => {
  if (typeof v !== "string") return undefined;
  if (v.includes("$")) return "USD";
  if (v.includes("€")) return "EUR";
  if (v.includes("£")) return "GBP";
  if (v.includes("¥")) return "JPY";
  return v.match(/\b([A-Z]{3})\b/)?.[1];
};

const URL_KEYS = ["url", "link", "href", "productUrl", "product_url"];
const TITLE_KEYS = ["title", "name", "headline", "label"];
const PRICE_KEYS = ["price", "salePrice", "sale_price", "cost", "amount"];
const IMG_KEYS = ["imageUrl", "image_url", "image", "thumbnail", "img", "photo"];
const SNIPPET_KEYS = ["snippet", "description", "summary", "excerpt", "content", "abstract"];
const ROLE_KEYS = ["headline", "jobTitle", "job_title", "title", "role", "position", "occupation", "bio"];
const ORG_KEYS = ["website", "domain", "industry", "founded", "headquarters", "hq", "employees", "logo", "logoUrl", "ticker", "address", "sector"];
const PERSON_KEYS = ["linkedin", "linkedinUrl", "avatar", "avatarUrl", "email", "twitter", "github", "firstName", "lastName"];

const LAT_KEYS = ["lat", "latitude"];
const LNG_KEYS = ["lng", "lon", "long", "longitude"];
const PLACE_LABEL_KEYS = ["label", "name", "title"];
const EVENT_DATE_KEYS = ["date", "year", "when", "publishedAt", "published_at", "datetime", "dateTime", "timestamp"];
const EVENT_TITLE_KEYS = ["title", "event", "headline", "name", "label", "milestone"];
const TASK_TITLE_KEYS = ["title", "task", "name", "summary", "item"];
const STATUS_KEYS = ["status", "state", "stage"];
const DONE_KEYS = ["done", "completed", "isDone", "is_done", "finished", "checked"];
const TASK_DEFAULTS = ["To do", "In progress", "Done"];
const TASK_OWNER_KEYS = ["owner", "assignee", "assigneeName", "assignee_name", "user"];
const TASK_DUE_KEYS = ["due", "dueDate", "due_date", "deadline"];
const TASK_PRIORITY_KEYS = ["priority", "urgency"];

const MAX_PLACES = 50;
const MAX_EVENTS = 50;
const MAX_TASKS = 50;
const MAX_PEOPLE = 24;

/** Unwrap {results: [...]} style wrappers; keep a title if present. */
function unwrap(data: unknown): { value: unknown; title?: string } {
  if (isObj(data)) {
    const arrays = Object.entries(data).filter(([, v]) => Array.isArray(v) && v.length && v.every(isObj));
    const scalars = Object.entries(data).filter(([, v]) => !Array.isArray(v) && !isObj(v));
    if (arrays.length === 1 && scalars.every(([k]) => /title|name|query|caption|total|count|source/i.test(k)))
      return { value: arrays[0][1], title: str(data.title) ?? str(data.name) ?? str(data.query) };
  }
  return { value: data };
}

const share = (rows: Obj[], test: (o: Obj) => boolean) => rows.filter(test).length / rows.length;

function asProducts(rows: Obj[], title?: string): Detection {
  if (share(rows, (o) => !!str(pick(o, TITLE_KEYS)) && isUrl(pick(o, URL_KEYS)) && num(pick(o, PRICE_KEYS)) !== undefined) < 0.6) return null;
  const products = rows.slice(0, 12).flatMap((o) => {
    const t = str(pick(o, TITLE_KEYS));
    const u = pick(o, URL_KEYS);
    if (!t || !isUrl(u)) return [];
    const priceRaw = pick(o, PRICE_KEYS);
    const img = pick(o, IMG_KEYS);
    const rating = num(pick(o, ["rating", "stars", "score"]));
    const reviews = num(pick(o, ["reviewCount", "review_count", "reviews", "ratingsTotal"]));
    return [
      {
        title: t,
        url: u,
        ...(isUrl(img) ? { imageUrl: img } : {}),
        ...(num(priceRaw) !== undefined ? { price: Math.max(0, num(priceRaw)!) } : {}),
        ...(str(pick(o, ["currency"])) ?? currencyOf(priceRaw) ? { currency: (str(pick(o, ["currency"])) ?? currencyOf(priceRaw))!.slice(0, 3).toUpperCase() } : {}),
        ...(rating !== undefined && rating >= 0 && rating <= 5 ? { rating } : {}),
        ...(reviews !== undefined ? { reviewCount: Math.max(0, Math.round(reviews)) } : {}),
        ...(str(pick(o, ["merchant", "store", "seller", "source"])) ? { merchant: str(pick(o, ["merchant", "store", "seller", "source"]))!.slice(0, 80) } : {}),
      },
    ];
  });
  return { component: "product_grid", data: { ...(title ? { title } : {}), products }, note: rows.length > 12 ? `first 12 of ${rows.length}` : undefined };
}

function asResults(rows: Obj[], title?: string): Detection {
  if (share(rows, (o) => !!str(pick(o, TITLE_KEYS)) && isUrl(pick(o, URL_KEYS))) < 0.6) return null;
  const results = rows.slice(0, 20).flatMap((o) => {
    const t = str(pick(o, TITLE_KEYS));
    const u = pick(o, URL_KEYS);
    if (!t || !isUrl(u)) return [];
    const snippet = str(pick(o, SNIPPET_KEYS));
    const date = str(pick(o, ["date", "publishedAt", "published", "published_date"]));
    const source = str(pick(o, ["source", "site", "publisher", "domain"]));
    return [{ title: t.slice(0, 200), url: u, ...(snippet ? { snippet: snippet.slice(0, 500) } : {}), ...(date ? { date: date.slice(0, 40) } : {}), ...(source ? { source: source.slice(0, 80) } : {}) }];
  });
  return { component: "result_list", data: { ...(title ? { title } : {}), results }, note: rows.length > 20 ? `first 20 of ${rows.length}` : undefined };
}

function asChart(value: unknown, title?: string): Detection {
  // Already chart-shaped.
  if (isObj(value) && Array.isArray(value.x) && Array.isArray(value.series)) {
    return { component: "chart", data: { kind: value.kind === "bar" ? "bar" : "line", ...value } };
  }
  // {label: number, ...} with 3+ entries → bar chart.
  if (isObj(value)) {
    const entries = Object.entries(value);
    if (entries.length >= 3 && entries.length <= 100 && entries.every(([, v]) => typeof v === "number")) {
      return { component: "chart", data: { kind: "bar", ...(title ? { title } : {}), x: entries.map(([k]) => k), series: [{ name: "Value", values: entries.map(([, v]) => v) }] } };
    }
    return null;
  }
  // [{date, a, b}, ...] where every other field is numeric → line chart over the date/period key.
  if (!Array.isArray(value) || value.length < 3 || !value.every(isObj)) return null;
  const rows = value as Obj[];
  const keys = Object.keys(rows[0]);
  const xKey = keys.find((k) => rows.every((r) => isDateLike(r[k])));
  if (!xKey) return null;
  const yKeys = keys.filter((k) => k !== xKey && rows.every((r) => r[k] == null || typeof r[k] === "number"));
  if (!yKeys.length || yKeys.length !== keys.length - 1) return null;
  const pts = rows.slice(0, 100);
  return {
    component: "chart",
    data: {
      kind: "line",
      ...(title ? { title } : {}),
      x: pts.map((r) => String(r[xKey])),
      series: yKeys.slice(0, 5).map((k) => ({ name: k, values: pts.map((r) => (typeof r[k] === "number" ? (r[k] as number) : null)) })),
    },
    note: rows.length > 100 ? `first 100 of ${rows.length} points` : undefined,
  };
}

function linksOf(o: Obj): { label: string; url: string }[] {
  const out: { label: string; url: string }[] = [];
  for (const [k, v] of Object.entries(o)) {
    if (isUrl(v) && !/image|avatar|logo|photo|thumbnail|picture|url$|^url$/i.test(k)) out.push({ label: k[0].toUpperCase() + k.slice(1), url: v as string });
  }
  return out.slice(0, 6);
}

function personData(o: Obj): Record<string, unknown> | null {
  const name = str(pick(o, ["name", "fullName", "full_name"])) ?? [str(o.firstName), str(o.lastName)].filter(Boolean).join(" ");
  if (!name) return null;
  const kind = str(pick(o, ["kind", "type"]))?.toLowerCase();
  if (kind && /company|organization|organisation|place|business/.test(kind)) return null;
  const role = str(pick(o, ROLE_KEYS));
  const personish = PERSON_KEYS.some((k) => pick(o, [k]) !== undefined) || kind === "person";
  if (!role && !personish) return null;
  if (!personish && ORG_KEYS.some((k) => pick(o, [k]) !== undefined)) return null;
  const avatar = pick(o, ["avatarUrl", "avatar", "photo", "image", "picture"]);
  const profileUrl = pick(o, ["profileUrl", "profile_url", "linkedinUrl", "linkedin", "url"]);
  const tags = pick(o, ["skills", "tags", "topics"]);
  const highlights = pick(o, ["highlights", "achievements", "experience"]);
  const company = str(pick(o, ["company", "organization", "employer"]));
  const location = str(pick(o, ["location", "city"]));
  const about = str(pick(o, ["about", "summary", "bio"]));
  return {
    name: name.slice(0, 120),
    ...(role ? { headline: role.slice(0, 200) } : {}),
    ...(isUrl(avatar) ? { avatarUrl: avatar } : {}),
    ...(company ? { company: company.slice(0, 120) } : {}),
    ...(location ? { location: location.slice(0, 120) } : {}),
    ...(about && about !== role ? { about: about.slice(0, 600) } : {}),
    ...(Array.isArray(tags) ? { tags: tags.filter((t) => typeof t === "string").slice(0, 10).map((t) => (t as string).slice(0, 40)) } : {}),
    ...(Array.isArray(highlights) ? { highlights: highlights.filter((t) => typeof t === "string").slice(0, 6).map((t) => (t as string).slice(0, 160)) } : {}),
    ...(isUrl(profileUrl) ? { profileUrl } : {}),
    ...(linksOf(o).length ? { links: linksOf(o) } : {}),
  };
}

function asProfile(o: Obj): Detection {
  const data = personData(o);
  return data ? { component: "profile_card", data } : null;
}

function asProfileGrid(rows: Obj[], title?: string): Detection {
  if (rows.length < 2 || rows.length > MAX_PEOPLE) return null;
  // The grid is for people with a role; person-like rows without one stay cards or tables.
  const people = rows.map((o) => (str(pick(o, ROLE_KEYS)) ? personData(o) : null));
  if (people.some((p) => !p)) return null;
  return { component: "profile_grid", data: { ...(title ? { title } : {}), people } };
}

function placeOf(o: Obj): Record<string, unknown> | null {
  const label = str(pick(o, PLACE_LABEL_KEYS));
  const lat = num(pick(o, LAT_KEYS));
  const lng = num(pick(o, LNG_KEYS));
  if (!label || lat === undefined || lng === undefined) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  const detail = str(pick(o, ["detail", "description", "summary", "about"]));
  const category = str(pick(o, ["category", "type", "kind"]));
  const address = str(pick(o, ["address", "street", "location"]));
  const url = pick(o, URL_KEYS);
  return {
    label: label.slice(0, 120),
    lat,
    lng,
    ...(detail ? { detail: detail.slice(0, 600) } : {}),
    ...(category ? { category: category.slice(0, 60) } : {}),
    ...(address ? { address: address.slice(0, 200) } : {}),
    ...(isUrl(url) ? { url } : {}),
  };
}

function asMap(value: unknown, title?: string): Detection {
  if (isObj(value)) {
    const place = placeOf(value);
    return place ? { component: "map", data: { ...(title ? { title } : {}), places: [place] } } : null;
  }
  if (!Array.isArray(value) || !value.length || !value.every(isObj)) return null;
  const rows = value as Obj[];
  if (!rows.every((o) => placeOf(o))) return null;
  return {
    component: "map",
    data: {
      ...(title ? { title } : {}),
      places: rows.slice(0, MAX_PLACES).map((o) => placeOf(o)!),
      ...(rows.length > MAX_PLACES ? { caption: `First ${MAX_PLACES} of ${rows.length} places` } : {}),
    },
    note: rows.length > MAX_PLACES ? `first ${MAX_PLACES} of ${rows.length}` : undefined,
  };
}

function eventDate(v: unknown): string | undefined {
  if (typeof v === "number" && Number.isInteger(v)) return parseTimelineDate(String(v)) ? String(v) : undefined;
  const match = /^(\d{4}(?:-\d{2}(?:-\d{2})?)?)/.exec(typeof v === "string" ? v.trim() : "");
  if (!match || !parseTimelineDate(match[1])) return undefined;
  return match[1];
}

function asTimeline(rows: Obj[], title?: string): Detection {
  const dateOf = (o: Obj) => eventDate(pick(o, EVENT_DATE_KEYS));
  const titleOf = (o: Obj) => str(pick(o, EVENT_TITLE_KEYS));
  if (!rows.every((o) => dateOf(o) !== undefined && titleOf(o) !== undefined)) return null;
  const events = rows.slice(0, MAX_EVENTS).map((o) => {
    const detail = str(pick(o, ["detail", "description", "summary", "content"]));
    const url = pick(o, URL_KEYS);
    const category = str(pick(o, ["category", "type", "kind"]));
    return {
      date: dateOf(o)!,
      title: titleOf(o)!.slice(0, 160),
      ...(detail ? { detail: detail.slice(0, 1200) } : {}),
      ...(isUrl(url) ? { url } : {}),
      ...(category ? { category: category.slice(0, 60) } : {}),
    };
  });
  return {
    component: "timeline",
    data: {
      ...(title ? { title } : {}),
      events,
      ...(rows.length > MAX_EVENTS ? { caption: `First ${MAX_EVENTS} of ${rows.length} events` } : {}),
    },
    note: rows.length > MAX_EVENTS ? `first ${MAX_EVENTS} of ${rows.length}` : undefined,
  };
}

function taskStatus(o: Obj): string | undefined {
  const status = str(pick(o, STATUS_KEYS));
  if (status) return status;
  const flag = pick(o, DONE_KEYS);
  if (typeof flag === "boolean") return flag ? "Done" : "To do";
  return undefined;
}

function asTaskList(rows: Obj[], title?: string): Detection {
  const titleOf = (o: Obj) => str(pick(o, TASK_TITLE_KEYS));
  const statusOf = (o: Obj) => taskStatus(o)?.slice(0, 40);
  if (!rows.every((o) => titleOf(o) !== undefined && statusOf(o) !== undefined)) return null;
  const statuses: string[] = [];
  for (const o of rows) {
    const s = statusOf(o)!;
    if (!statuses.includes(s)) statuses.push(s);
  }
  const kept = statuses.slice(0, 6);
  for (const fallback of TASK_DEFAULTS) {
    if (kept.length >= 2) break;
    if (!kept.includes(fallback)) kept.push(fallback);
  }
  const items = rows.flatMap((o) => {
    const status = statusOf(o)!;
    if (!kept.includes(status)) return [];
    const owner = str(pick(o, TASK_OWNER_KEYS));
    const dueRaw = str(pick(o, TASK_DUE_KEYS));
    const due = dueRaw && parseIsoDate(dueRaw) ? dueRaw : undefined;
    const priorityRaw = str(pick(o, TASK_PRIORITY_KEYS))?.toLowerCase();
    const priority = priorityRaw === "low" || priorityRaw === "medium" || priorityRaw === "high" ? priorityRaw : undefined;
    const url = pick(o, URL_KEYS);
    const labels = pick(o, ["labels", "tags"]);
    return [
      {
        title: titleOf(o)!.slice(0, 160),
        status,
        ...(owner ? { owner: owner.slice(0, 80) } : {}),
        ...(due ? { due } : {}),
        ...(priority ? { priority } : {}),
        ...(isUrl(url) ? { url } : {}),
        ...(Array.isArray(labels) ? { labels: labels.filter((x) => typeof x === "string").slice(0, 8).map((x) => (x as string).slice(0, 40)) } : {}),
      },
    ];
  });
  return {
    component: "task_list",
    data: {
      ...(title ? { title } : {}),
      statuses: kept,
      items: items.slice(0, MAX_TASKS),
      ...(items.length > MAX_TASKS ? { caption: `First ${MAX_TASKS} of ${items.length} items` } : {}),
    },
    note: items.length > MAX_TASKS ? `first ${MAX_TASKS} of ${items.length}` : undefined,
  };
}

function asEntity(o: Obj): Detection {
  const name = str(pick(o, ["name", "title"]));
  if (!name) return null;
  const kindRaw = str(pick(o, ["kind", "type", "category"]))?.toLowerCase() ?? "";
  const kind = /company|business|startup|corp/.test(kindRaw) ? "company" : /org|university|school|ngo/.test(kindRaw) ? "organization" : /place|city|venue|park|country/.test(kindRaw) ? "place" : undefined;
  if (!kind && !ORG_KEYS.some((k) => pick(o, [k]) !== undefined)) return null;
  const skip = new Set(["name", "title", "kind", "type", "category", "description", "summary", "tagline", "logo", "logourl", "website", "url", "source"]);
  const facts = Object.entries(o)
    .filter(([k, v]) => !skip.has(k.toLowerCase()) && (typeof v === "string" || typeof v === "number") && !isUrl(v))
    .slice(0, 8)
    .map(([k, v]) => ({ label: (k[0].toUpperCase() + k.slice(1)).replace(/_/g, " ").slice(0, 40), value: String(v).slice(0, 120) }));
  const site = pick(o, ["website", "url", "homepage"]);
  const logo = pick(o, ["logoUrl", "logo", "image"]);
  const desc = str(pick(o, ["description", "summary"]));
  const tagline = str(pick(o, ["tagline", "slogan"]));
  return {
    component: "entity_card",
    data: {
      name: name.slice(0, 120),
      ...(kind ? { kind } : {}),
      ...(tagline ? { tagline: tagline.slice(0, 160) } : {}),
      ...(desc ? { description: desc.slice(0, 600) } : {}),
      ...(isUrl(logo) ? { logoUrl: logo } : {}),
      ...(facts.length ? { facts } : {}),
      ...(isUrl(site) ? { websiteUrl: site } : {}),
    },
  };
}

function asTable(value: unknown, title?: string, minRows = 2): Detection {
  if (!Array.isArray(value) || value.length < minRows || !value.every(isObj)) return null;
  const rows = value as Obj[];
  const counts = new Map<string, number>();
  for (const r of rows) for (const k of Object.keys(r)) counts.set(k, (counts.get(k) ?? 0) + 1);
  const keys = [...counts].filter(([, n]) => n / rows.length >= 0.5).map(([k]) => k).slice(0, 12);
  if (!keys.length) return null;
  const columns = keys.map((k) => {
    const vals = rows.map((r) => r[k]).filter((v) => v != null && v !== "");
    const all = (f: (v: unknown) => boolean) => vals.length > 0 && vals.every(f);
    const type = all((v) => typeof v === "number")
      ? /price|cost|revenue|amount|salary|funding/i.test(k) ? "money" : "number"
      : all(isUrl) ? "link" : all(isDateLike) ? "date" : "text";
    return { key: k, label: (k[0].toUpperCase() + k.slice(1)).replace(/[_-]/g, " ").slice(0, 60), type };
  });
  const flat = rows.slice(0, 50).map((r) => Object.fromEntries(keys.map((k) => [k, isObj(r[k]) || Array.isArray(r[k]) ? JSON.stringify(r[k]) : r[k]])));
  return {
    component: "data_table",
    data: { ...(title ? { title } : {}), columns, rows: flat, ...(rows.length > 50 ? { caption: `First 50 of ${rows.length} rows` } : {}) },
    note: rows.length > 50 ? `first 50 of ${rows.length} rows` : undefined,
  };
}

const HINTS: Record<string, AutoComponent> = {
  products: "product_grid", product: "product_grid", product_grid: "product_grid", show_products: "product_grid",
  results: "result_list", result_list: "result_list", show_results: "result_list", search: "result_list",
  map: "map", show_map: "map", places: "map", locations: "map", location: "map",
  timeline: "timeline", show_timeline: "timeline", events: "timeline", history: "timeline",
  tasks: "task_list", task: "task_list", task_list: "task_list", show_tasks: "task_list", todo: "task_list", todos: "task_list", kanban: "task_list",
  chart: "chart", show_chart: "chart", line: "chart", bar: "chart",
  profiles: "profile_grid", profile_grid: "profile_grid", show_profiles: "profile_grid", people: "profile_grid", team: "profile_grid",
  profile: "profile_card", profile_card: "profile_card", show_profile_card: "profile_card", person: "profile_card",
  entity: "entity_card", entity_card: "entity_card", show_entity_card: "entity_card", company: "entity_card", place: "entity_card",
  table: "data_table", data_table: "data_table", show_table: "data_table",
};

const ORDER = ["product_grid", "result_list", "map", "timeline", "task_list", "chart", "profile_grid", "profile_card", "entity_card", "data_table"] as const;

export function detect(data: unknown, hint?: string): Detection {
  const { value, title } = unwrap(data);
  const rows = Array.isArray(value) && value.length && value.every(isObj) ? (value as Obj[]) : null;
  const single = isObj(value) ? value : rows?.length === 1 ? rows[0] : null;
  const rules: Record<AutoComponent, () => Detection> = {
    product_grid: () => (rows ? asProducts(rows, title) : null),
    result_list: () => (rows ? asResults(rows, title) : null),
    map: () => asMap(value, title),
    timeline: () => (rows ? asTimeline(rows, title) : null),
    task_list: () => (rows ? asTaskList(rows, title) : null),
    chart: () => asChart(value, title),
    profile_grid: () => (rows ? asProfileGrid(rows, title) : null),
    profile_card: () => (single ? asProfile(single) : null),
    entity_card: () => (single ? asEntity(single) : null),
    data_table: () => asTable(value, title),
  };
  const wanted = hint ? HINTS[hint.trim().toLowerCase()] : undefined;
  if (wanted) {
    const forced = wanted === "data_table" ? asTable(value, title, 1) : rules[wanted]();
    if (forced) return forced;
  }
  for (const k of ORDER) {
    const d = rules[k]();
    if (d) return d;
  }
  return null;
}

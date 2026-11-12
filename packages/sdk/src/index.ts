/**
 * Inkview SDK: render Inkview components from any MCP server. One call to
 * `registerInkview` serves the shared view bundle; each builder validates its
 * data, returns the markdown fallback and the structured result the view reads.
 */
import { registerAppResource, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import type { CallToolResult, McpServer } from "@modelcontextprotocol/server";
import type { z } from "zod";
// Inlined at build time so the package needs no view file on disk.
import viewHtml from "../../../dist/ui/app.html";
import { resourceMeta } from "../../inkview/src/resource.js";
import type { ComponentMeta } from "../../../src/components/types.js";

import { meta as profileCardMeta } from "../../../src/components/profile-card/meta.js";
import { profileCardSchema, HARD_MAX_HIGHLIGHTS } from "../../../src/components/profile-card/schema.js";
import { toMarkdown as profileCardMarkdown } from "../../../src/components/profile-card/markdown.js";
import { meta as profileGridMeta } from "../../../src/components/profile-grid/meta.js";
import { profileGridSchema, HARD_MAX_PEOPLE } from "../../../src/components/profile-grid/schema.js";
import { toMarkdown as profileGridMarkdown } from "../../../src/components/profile-grid/markdown.js";
import { meta as dataTableMeta } from "../../../src/components/data-table/meta.js";
import { tableSchema, HARD_MAX_ROWS } from "../../../src/components/data-table/schema.js";
import { toMarkdown as dataTableMarkdown } from "../../../src/components/data-table/markdown.js";
import { meta as resultListMeta } from "../../../src/components/result-list/meta.js";
import { resultListSchema, HARD_MAX_RESULTS } from "../../../src/components/result-list/schema.js";
import { toMarkdown as resultListMarkdown } from "../../../src/components/result-list/markdown.js";
import { meta as entityCardMeta } from "../../../src/components/entity-card/meta.js";
import { entityCardSchema, HARD_MAX_FACTS } from "../../../src/components/entity-card/schema.js";
import { toMarkdown as entityCardMarkdown } from "../../../src/components/entity-card/markdown.js";
import { meta as comparisonMeta } from "../../../src/components/comparison/meta.js";
import { comparisonSchema, HARD_MAX_ITEMS as HARD_MAX_COMPARISON_ITEMS } from "../../../src/components/comparison/schema.js";
import { toMarkdown as comparisonMarkdown } from "../../../src/components/comparison/markdown.js";
import { meta as chartMeta } from "../../../src/components/chart/meta.js";
import { chartSchema, HARD_MAX_X } from "../../../src/components/chart/schema.js";
import { toMarkdown as chartMarkdown } from "../../../src/components/chart/markdown.js";
import { meta as productGridMeta } from "../../../src/components/product-grid/meta.js";
import { productGridSchema, HARD_MAX_PRODUCTS } from "../../../src/components/product-grid/schema.js";
import { toMarkdown as productGridMarkdown } from "../../../src/components/product-grid/markdown.js";
import { meta as timelineMeta } from "../../../src/components/timeline/meta.js";
import { timelineSchema, HARD_MAX_EVENTS } from "../../../src/components/timeline/schema.js";
import { toMarkdown as timelineMarkdown } from "../../../src/components/timeline/markdown.js";
import { meta as taskListMeta } from "../../../src/components/task-list/meta.js";
import { taskListSchema, HARD_MAX_ITEMS as HARD_MAX_TASK_ITEMS } from "../../../src/components/task-list/schema.js";
import { toMarkdown as taskListMarkdown } from "../../../src/components/task-list/markdown.js";
import { meta as documentPreviewMeta } from "../../../src/components/document-preview/meta.js";
import { documentPreviewSchema, HARD_MAX_BODY } from "../../../src/components/document-preview/schema.js";
import { toMarkdown as documentPreviewMarkdown } from "../../../src/components/document-preview/markdown.js";
import { meta as formMeta } from "../../../src/components/form/meta.js";
import { formSchema, HARD_MAX_FIELDS } from "../../../src/components/form/schema.js";
import { toMarkdown as formMarkdown } from "../../../src/components/form/markdown.js";
import { meta as mapMeta } from "../../../src/components/map/meta.js";
import { mapSchema, HARD_MAX_PLACES } from "../../../src/components/map/schema.js";
import { toMarkdown as mapMarkdown } from "../../../src/components/map/markdown.js";
import { mapConfig } from "../../../src/components/map/config.js";
import { meta as listingsMeta } from "../../../src/components/listings/meta.js";
import { listingsSchema, HARD_MAX_LISTINGS } from "../../../src/components/listings/schema.js";
import { toMarkdown as listingsMarkdown } from "../../../src/components/listings/markdown.js";
import { meta as itineraryMeta } from "../../../src/components/itinerary/meta.js";
import { itinerarySchema, HARD_MAX_DAYS } from "../../../src/components/itinerary/schema.js";
import { toMarkdown as itineraryMarkdown } from "../../../src/components/itinerary/markdown.js";

export const DEFAULT_APP_URI = "ui://inkview/v1/app.html";

export type ComponentId =
  | "profile_card"
  | "profile_grid"
  | "data_table"
  | "result_list"
  | "entity_card"
  | "comparison"
  | "chart"
  | "product_grid"
  | "timeline"
  | "task_list"
  | "document_preview"
  | "form"
  | "map"
  | "listings"
  | "itinerary";

/**
 * Tool metadata that links a tool to the Inkview view. A type alias rather than
 * an interface so it satisfies registerAppTool's `Record<string, unknown>`.
 */
export type InkviewToolMeta = {
  ui: { resourceUri: string };
  /** Read by the view before a result arrives, so SDK tools render from their input. */
  inkview?: { component: ComponentId };
};

export interface InkviewToolMetaOptions {
  /** Component the tool renders; omit to render only once the tool returns. */
  component?: ComponentId;
  /** Resource URI override for a separately registered Inkview instance. */
  uri?: string;
}

export function inkviewToolMeta(options: InkviewToolMetaOptions = {}): InkviewToolMeta {
  return {
    ui: { resourceUri: options.uri ?? DEFAULT_APP_URI },
    ...(options.component ? { inkview: { component: options.component } } : {}),
  };
}

export interface InkviewServerOptions {
  /** Resource URI to register. Defaults to `ui://inkview/v1/app.html`. */
  uri?: string;
  /** Extra image hosts the view may load, on top of the built-in list and INKVIEW_IMAGE_DOMAINS. */
  imageDomains?: string[];
}

export interface InkviewInstance {
  /** URI tools should point at; pass it to `inkviewToolMeta({ uri })` when not using the instance helper. */
  uri: string;
  /** Tool metadata pointing at this instance's view. */
  inkviewToolMeta(options?: Omit<InkviewToolMetaOptions, "uri">): InkviewToolMeta;
}

/**
 * Serve the shared Inkview view from this MCP server. Call once, then attach
 * `inkview.inkviewToolMeta({ component })` to the tools that render Inkview data.
 */
export function registerInkview(server: McpServer, options: InkviewServerOptions = {}): InkviewInstance {
  const uri = options.uri ?? DEFAULT_APP_URI;
  const env: NodeJS.ProcessEnv = { ...process.env };
  if (options.imageDomains?.length) {
    const configured = (env.INKVIEW_IMAGE_DOMAINS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    env.INKVIEW_IMAGE_DOMAINS = [...configured, ...options.imageDomains].join(",");
  }

  registerAppResource(
    server,
    "Inkview components",
    uri,
    { mimeType: RESOURCE_MIME_TYPE, description: "Inkview UI components (v1)" },
    async () => ({
      contents: [{ uri, mimeType: RESOURCE_MIME_TYPE, text: viewHtml, _meta: resourceMeta(env) }],
    }),
  );

  return {
    uri,
    inkviewToolMeta: (toolOptions = {}) => inkviewToolMeta({ ...toolOptions, uri }),
  };
}

/** Per-builder options. `limit` raises the component's primary list cap. */
export interface BuildOptions {
  /**
   * Primary list cap: rows for a table, people, results, products, events,
   * items, places, facts, x values, fields or body characters, depending on
   * the builder. Defaults to the component cap; each builder documents its
   * hard maximum.
   */
  limit?: number;
}

function cap(requested: number | undefined, fallback: number, hardMax: number, label: string): number {
  if (requested == null) return fallback;
  if (!Number.isInteger(requested) || requested < 1 || requested > hardMax) {
    throw new RangeError(`limit for ${label} must be an integer from 1 to ${hardMax}.`);
  }
  return requested;
}

function result(meta: ComponentMeta, text: string, data: unknown, config?: unknown): CallToolResult {
  return {
    content: [{ type: "text", text }],
    structuredContent: {
      component: meta.component,
      schemaVersion: meta.schemaVersion,
      data,
      ...(config !== undefined ? { config } : {}),
    },
  };
}

export type ProfileCardInput = z.input<ReturnType<typeof profileCardSchema>>;
/** One person. `limit` caps highlights (default 6, max 50). */
export function showProfileCard(data: ProfileCardInput, options: BuildOptions = {}): CallToolResult {
  const parsed = profileCardSchema(cap(options.limit, 6, HARD_MAX_HIGHLIGHTS, "highlights")).parse(data);
  return result(profileCardMeta, profileCardMarkdown(parsed), parsed);
}

export type ProfileGridInput = z.input<ReturnType<typeof profileGridSchema>>;
/** Two or more people. `limit` caps people (default 24, max 200). */
export function showProfiles(data: ProfileGridInput, options: BuildOptions = {}): CallToolResult {
  const parsed = profileGridSchema(cap(options.limit, 24, HARD_MAX_PEOPLE, "people")).parse(data);
  return result(profileGridMeta, profileGridMarkdown(parsed), parsed);
}

export type DataTableInput = z.input<ReturnType<typeof tableSchema>>;
/** Rows with shared columns. `limit` caps rows (default 50, max 500). */
export function showTable(data: DataTableInput, options: BuildOptions = {}): CallToolResult {
  const parsed = tableSchema(cap(options.limit, 50, HARD_MAX_ROWS, "rows")).parse(data);
  return result(dataTableMeta, dataTableMarkdown(parsed), parsed);
}

export type ResultListInput = z.input<ReturnType<typeof resultListSchema>>;
/** Search results. `limit` caps results (default 20, max 200). */
export function showResults(data: ResultListInput, options: BuildOptions = {}): CallToolResult {
  const parsed = resultListSchema(cap(options.limit, 20, HARD_MAX_RESULTS, "results")).parse(data);
  return result(resultListMeta, resultListMarkdown(parsed), parsed);
}

export type EntityCardInput = z.input<ReturnType<typeof entityCardSchema>>;
/** One company, organization or place. `limit` caps facts (default 8, max 50). */
export function showEntityCard(data: EntityCardInput, options: BuildOptions = {}): CallToolResult {
  const parsed = entityCardSchema(cap(options.limit, 8, HARD_MAX_FACTS, "facts")).parse(data);
  return result(entityCardMeta, entityCardMarkdown(parsed), parsed);
}

export type ComparisonInput = z.input<ReturnType<typeof comparisonSchema>>;
/** Options side by side. `limit` caps items (default 5, max 20). */
export function showComparison(data: ComparisonInput, options: BuildOptions = {}): CallToolResult {
  const parsed = comparisonSchema(cap(options.limit, 5, HARD_MAX_COMPARISON_ITEMS, "items")).parse(data);
  return result(comparisonMeta, comparisonMarkdown(parsed), parsed);
}

export type ChartInput = z.input<ReturnType<typeof chartSchema>>;
/** Line or bar chart. `limit` caps x values (default 100, max 1000). */
export function showChart(data: ChartInput, options: BuildOptions = {}): CallToolResult {
  const parsed = chartSchema(cap(options.limit, 100, HARD_MAX_X, "x values")).parse(data);
  return result(chartMeta, chartMarkdown(parsed), parsed);
}

export type ProductGridInput = z.input<ReturnType<typeof productGridSchema>>;
/** Shopping results. `limit` caps products (default 12, max 100). */
export function showProducts(data: ProductGridInput, options: BuildOptions = {}): CallToolResult {
  const parsed = productGridSchema(cap(options.limit, 12, HARD_MAX_PRODUCTS, "products")).parse(data);
  return result(productGridMeta, productGridMarkdown(parsed), parsed);
}

export type TimelineInput = z.input<ReturnType<typeof timelineSchema>>;
/** Dated events. `limit` caps events (default 50, max 500). */
export function showTimeline(data: TimelineInput, options: BuildOptions = {}): CallToolResult {
  const parsed = timelineSchema(cap(options.limit, 50, HARD_MAX_EVENTS, "events")).parse(data);
  return result(timelineMeta, timelineMarkdown(parsed), parsed);
}

export type TaskListInput = z.input<ReturnType<typeof taskListSchema>>;
/** Items with statuses. `limit` caps items (default 50, max 500). */
export function showTasks(data: TaskListInput, options: BuildOptions = {}): CallToolResult {
  const parsed = taskListSchema(cap(options.limit, 50, HARD_MAX_TASK_ITEMS, "items")).parse(data);
  return result(taskListMeta, taskListMarkdown(parsed), parsed);
}

export type DocumentInput = z.input<ReturnType<typeof documentPreviewSchema>>;
/** A draft to review. `limit` caps body characters (default 20000, max 100000). */
export function showDocument(data: DocumentInput, options: BuildOptions = {}): CallToolResult {
  const parsed = documentPreviewSchema(cap(options.limit, 20000, HARD_MAX_BODY, "body characters")).parse(data);
  return result(documentPreviewMeta, documentPreviewMarkdown(parsed), parsed);
}

export type FormInput = z.input<ReturnType<typeof formSchema>>;
/** A short form. `limit` caps fields (default 12, max 50). */
export function showForm(data: FormInput, options: BuildOptions = {}): CallToolResult {
  const parsed = formSchema(cap(options.limit, 12, HARD_MAX_FIELDS, "fields")).parse(data);
  return result(formMeta, formMarkdown(parsed), parsed);
}

export type MapInput = z.input<ReturnType<typeof mapSchema>>;
/** Places on a map. `limit` caps places (default 50, max 500). */
export function showMap(data: MapInput, options: BuildOptions = {}): CallToolResult {
  const parsed = mapSchema(cap(options.limit, 50, HARD_MAX_PLACES, "places")).parse(data);
  return result(mapMeta, mapMarkdown(parsed), parsed, mapConfig());
}

export type ListingsInput = z.input<ReturnType<typeof listingsSchema>>;
/** Places, services, stays, events or homes as cards. `limit` caps listings (default 20, max 100). */
export function showListings(data: ListingsInput, options: BuildOptions = {}): CallToolResult {
  const parsed = listingsSchema(cap(options.limit, 20, HARD_MAX_LISTINGS, "listings")).parse(data);
  return result(listingsMeta, listingsMarkdown(parsed), parsed, mapConfig());
}

export type ItineraryInput = z.input<ReturnType<typeof itinerarySchema>>;
/** A day-by-day plan of stops. `limit` caps days (default 14, max 60). */
export function showItinerary(data: ItineraryInput, options: BuildOptions = {}): CallToolResult {
  const parsed = itinerarySchema(cap(options.limit, 14, HARD_MAX_DAYS, "days")).parse(data);
  return result(itineraryMeta, itineraryMarkdown(parsed), parsed, mapConfig());
}

/** Builders by component, for call sites that prefer `inkview.table(data)`. */
export const inkview = {
  profileCard: showProfileCard,
  profiles: showProfiles,
  table: showTable,
  results: showResults,
  entityCard: showEntityCard,
  comparison: showComparison,
  chart: showChart,
  products: showProducts,
  timeline: showTimeline,
  tasks: showTasks,
  document: showDocument,
  form: showForm,
  map: showMap,
  listings: showListings,
  itinerary: showItinerary,
} as const;


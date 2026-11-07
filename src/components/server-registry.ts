/** Server-side registry: schema + markdown fallback per component. */
import type { z } from "zod";
import type { ComponentMeta } from "./types.js";
import * as profileCard from "./profile-card/server.js";
import * as profileGrid from "./profile-grid/server.js";
import * as dataTable from "./data-table/server.js";
import * as resultList from "./result-list/server.js";
import * as entityCard from "./entity-card/server.js";
import * as comparison from "./comparison/server.js";
import * as chart from "./chart/server.js";
import * as productGrid from "./product-grid/server.js";
import * as timeline from "./timeline/server.js";
import * as taskList from "./task-list/server.js";
import * as documentPreview from "./document-preview/server.js";
import * as form from "./form/server.js";

export interface ServerEntry {
  meta: ComponentMeta;
  schema: z.ZodType<Record<string, unknown>>;
  toMarkdown(data: any): string;
}

/** Order matters: it is the order tools are listed to the model. */
export const serverComponents: ServerEntry[] = [profileCard, profileGrid, dataTable, resultList, entityCard, comparison, chart, productGrid, timeline, taskList, documentPreview, form];

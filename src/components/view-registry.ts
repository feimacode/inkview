/** View-side registry: React view + structural guard per component. No zod here. */
import type { ViewEntry } from "./types.js";
import { meta as profileCardMeta } from "./profile-card/meta.js";
import * as profileCard from "./profile-card/View.js";
import { meta as profileGridMeta } from "./profile-grid/meta.js";
import * as profileGrid from "./profile-grid/View.js";
import { meta as dataTableMeta } from "./data-table/meta.js";
import * as dataTable from "./data-table/View.js";
import { meta as resultListMeta } from "./result-list/meta.js";
import * as resultList from "./result-list/View.js";
import { meta as entityCardMeta } from "./entity-card/meta.js";
import * as entityCard from "./entity-card/View.js";
import { meta as comparisonMeta } from "./comparison/meta.js";
import * as comparison from "./comparison/View.js";
import { meta as chartMeta } from "./chart/meta.js";
import * as chart from "./chart/View.js";
import { meta as productGridMeta } from "./product-grid/meta.js";
import * as productGrid from "./product-grid/View.js";
import { meta as timelineMeta } from "./timeline/meta.js";
import * as timeline from "./timeline/View.js";

export const viewComponents: ViewEntry[] = [
  { meta: profileCardMeta, View: profileCard.View, accepts: profileCard.accepts },
  { meta: profileGridMeta, View: profileGrid.View, accepts: profileGrid.accepts },
  { meta: dataTableMeta, View: dataTable.View, accepts: dataTable.accepts },
  { meta: resultListMeta, View: resultList.View, accepts: resultList.accepts },
  { meta: entityCardMeta, View: entityCard.View, accepts: entityCard.accepts },
  { meta: comparisonMeta, View: comparison.View, accepts: comparison.accepts },
  { meta: chartMeta, View: chart.View, accepts: chart.accepts },
  { meta: productGridMeta, View: productGrid.View, accepts: productGrid.accepts },
  { meta: timelineMeta, View: timeline.View, accepts: timeline.accepts },
];

export const byComponent = new Map(viewComponents.map((c) => [c.meta.component, c]));
export const byTool = new Map(viewComponents.map((c) => [c.meta.tool, c]));

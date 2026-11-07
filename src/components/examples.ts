/** All component examples, for the preview gallery. */
import type { Example } from "./types.js";
import { viewComponents } from "./view-registry.js";
import profileCard from "./profile-card/examples.json";
import profileGrid from "./profile-grid/examples.json";
import dataTable from "./data-table/examples.json";
import resultList from "./result-list/examples.json";
import entityCard from "./entity-card/examples.json";
import comparison from "./comparison/examples.json";
import chart from "./chart/examples.json";
import productGrid from "./product-grid/examples.json";
import timeline from "./timeline/examples.json";
import taskList from "./task-list/examples.json";
import documentPreview from "./document-preview/examples.json";
import form from "./form/examples.json";

const byComponent: Record<string, unknown> = {
  profile_card: profileCard,
  profile_grid: profileGrid,
  data_table: dataTable,
  result_list: resultList,
  entity_card: entityCard,
  comparison,
  chart,
  product_grid: productGrid,
  timeline,
  task_list: taskList,
  document_preview: documentPreview,
  form,
};

export const examples = viewComponents.map((c) => ({
  tool: c.meta.tool,
  component: c.meta.component,
  examples: (byComponent[c.meta.component] ?? []) as Example[],
}));

// Fails when the shared view bundle exceeds its gzip budget.
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const BUDGET_KB = Number(process.env.INKVIEW_VIEW_BUDGET_KB ?? 100);
const kb = gzipSync(readFileSync("dist/ui/app.html")).length / 1024;
if (kb > BUDGET_KB) {
  console.error(`✗ view bundle is ${kb.toFixed(1)} KB gzipped, over the ${BUDGET_KB} KB budget`);
  process.exit(1);
}
console.log(`✓ view bundle ${kb.toFixed(1)} KB gzipped (budget ${BUDGET_KB} KB)`);

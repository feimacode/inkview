import { mdChecked, mdProvenance } from "../../runtime/provenance.js";
import type { ProductGrid } from "./schema.js";

const money = (p: number, c?: string) => {
  try {
    return new Intl.NumberFormat("en-US", c ? { style: "currency", currency: c } : { minimumFractionDigits: 2 }).format(p);
  } catch {
    return `${p}${c ? ` ${c}` : ""}`;
  }
};

export function toMarkdown(g: ProductGrid): string {
  const lines = g.title ? [`### ${g.title}`, ""] : [];
  g.products.forEach((p, i) => {
    const bits = [
      mdChecked(p, "price", p.price != null ? money(p.price, p.currency) : ""),
      mdChecked(p, "rating", p.rating != null ? `★ ${p.rating}${p.reviewCount != null ? ` (${p.reviewCount})` : ""}` : ""),
      p.merchant ?? "",
      p.availability === "out_of_stock" ? "out of stock" : "",
    ].filter(Boolean);
    lines.push(`${i + 1}. [${p.title}](${p.url})${bits.length ? ` — ${bits.join(" · ")}` : ""}`);
  });
  const src = mdProvenance({ source: g.source, items: g.products, sensitive: true });
  if (src) lines.push("", src);
  return lines.join("\n");
}

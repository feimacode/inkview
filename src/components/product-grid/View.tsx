import { useMemo, useState } from "react";
import type { ViewProps } from "../types.js";
import type { Product, ProductGrid } from "./schema.js";
import { Button, hostOf, Provenance, Unchecked, useBusy } from "../../runtime/primitives.js";
import { fmtMoney, fmtNumber } from "../../runtime/format.js";
import { isUnverified } from "../../runtime/provenance.js";
import { Actions } from "../../runtime/actions.js";
import "./product-grid.css";

export function accepts(d: unknown): d is ProductGrid {
  return !!d && Array.isArray((d as ProductGrid).products);
}

type SortKey = "relevance" | "price-asc" | "price-desc" | "rating";
const AVAIL: Record<string, string> = { in_stock: "In stock", limited: "Limited stock", out_of_stock: "Out of stock", preorder: "Pre-order" };

function ProductImage({ p }: { p: Product }) {
  const [failed, setFailed] = useState(false);
  if (p.imageUrl && !failed)
    return <img className="pg-img" src={p.imageUrl} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} />;
  return (
    <div className="pg-img pg-img--empty" aria-hidden="true">
      {p.title.slice(0, 1).toUpperCase()}
    </div>
  );
}

export function View({ data: g, actions }: ViewProps<ProductGrid>) {
  const { locale } = actions;
  const [sort, setSort] = useState<SortKey>("relevance");
  const [picked, setPicked] = useState<number[]>([]);
  const { busy, run } = useBusy();

  const order = useMemo(() => {
    const idx = g.products.map((_, i) => i);
    const val = (i: number) => (sort === "rating" ? g.products[i].rating : g.products[i].price);
    if (sort === "relevance") return idx;
    return idx.sort((a, b) => {
      const va = val(a);
      const vb = val(b);
      if (va == null) return vb == null ? 0 : 1;
      if (vb == null) return -1;
      return sort === "price-asc" ? va - vb : vb - va;
    });
  }, [g, sort]);

  const togglePick = (i: number) =>
    setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : p.length >= 4 ? p : [...p, i]));

  const compare = () =>
    run("compare", () =>
      actions.sendMessage(
        `Compare these products and recommend one:\n${picked.map((i) => `- ${g.products[i].title} (${g.products[i].url})`).join("\n")}\nShow the comparison with show_comparison.`,
      ),
    );

  return (
    <section className="ink-card pg" aria-label={g.title ?? "Products"}>
      <div className="pg-bar">
        {g.title && <h2 className="ink-title pg-title">{g.title}</h2>}
        <label className="pg-sort">
          <span className="ink-muted">Sort</span>
          <select value={sort} onChange={(e) => setSort((e.target as HTMLSelectElement).value as SortKey)}>
            <option value="relevance">Best match</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="rating">Rating</option>
          </select>
        </label>
      </div>
      <ul className="pg-grid">
        {order.map((i) => {
          const p = g.products[i];
          const on = picked.includes(i);
          return (
            <li key={i} className={`pg-card${on ? " pg-picked" : ""}`}>
              <ProductImage p={p} />
              <h3 className="pg-name" title={p.title}>
                {p.title}
              </h3>
              <p className="pg-price">
                {p.price != null ? fmtMoney(p.price, p.currency, locale) : <span className="ink-faint">No price</span>}
                <Unchecked on={isUnverified(p, "price")} />
              </p>
              {p.rating != null && (
                <p className="pg-rating">
                  <span aria-hidden="true">★</span> {fmtNumber(p.rating, locale, { maximumFractionDigits: 1 })}
                  {p.reviewCount != null && <span className="ink-faint"> ({fmtNumber(p.reviewCount, locale)})</span>}
                  <span className="ink-sr"> out of 5</span>
                  <Unchecked on={isUnverified(p, "rating")} />
                </p>
              )}
              <p className="pg-meta ink-muted">
                {p.merchant ?? hostOf(p.url)}
                {p.availability && AVAIL[p.availability] && (
                  <span className={`pg-avail pg-avail--${p.availability}`}> · {AVAIL[p.availability]}</span>
                )}
                <Unchecked on={isUnverified(p, "availability")} />
              </p>
              {p.variants && <p className="pg-meta ink-faint">{p.variants}</p>}
              <div className="pg-actions">
                <Actions item={p} actions={actions} name={p.title} openLabel="View at store" openAria={`View ${p.title} at store`} copy={["link"]}>
                  <label className="pg-pick">
                    <input
                      type="checkbox"
                      checked={on}
                      disabled={!on && picked.length >= 4}
                      onChange={() => togglePick(i)}
                      aria-label={`Select ${p.title} to compare`}
                    />
                    <span>Compare</span>
                  </label>
                </Actions>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="ink-actions">
        <Button disabled={picked.length < 2 || busy !== null} onClick={compare}>
          {busy === "compare" ? "Asking…" : `Compare selected${picked.length ? ` (${picked.length})` : ""}`}
        </Button>
        {picked.length === 1 && <span className="ink-faint pg-hint">Pick 2 to 4 products</span>}
      </div>
      <Provenance source={g.source} items={g.products} sensitive open={actions.openLink} locale={locale} />
    </section>
  );
}

import { useMemo, useState } from "react";
import type { ViewProps } from "../types.js";
import type { MapConfig } from "../map/config.js";
import type { Listing, Listings } from "./schema.js";
import { Button, Chip, Provenance, Unchecked, useBusy } from "../../runtime/primitives.js";
import { fmtDate, fmtNumber } from "../../runtime/format.js";
import { isUnverified } from "../../runtime/provenance.js";
import { Actions, copyText } from "../../runtime/actions.js";
import { MapSurface } from "../map/Surface.js";
import { distanceText, fresh, kindOf, priceSortable, priceText, shortPrice } from "./format.js";
import "../product-grid/product-grid.css";
import "./listings.css";

export function accepts(d: unknown): d is Listings {
  const g = d as Listings;
  return !!g && Array.isArray(g.listings) && g.listings.length > 0 && g.listings.every((l) => l && typeof l.title === "string");
}

type SortKey = "match" | "rating" | "distance" | "price";
// Stays and events keep the default "Open at site": Inkview links out, it never books.
const OPEN: Record<string, string> = { service: "Visit website", place: "Visit website", home: "View listing" };
const hasPin = (l: Listing): l is Listing & { lat: number; lng: number } => typeof l.lat === "number" && typeof l.lng === "number";
const where = (l: Listing) => (l.url ? ` (${l.url})` : l.address ? ` (${l.address})` : "");

function Photo({ l }: { l: Listing }) {
  const [failed, setFailed] = useState(false);
  if (l.imageUrl && !failed)
    return <img className="pg-img ls-img" src={l.imageUrl} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} />;
  return (
    <div className="pg-img ls-img pg-img--empty" aria-hidden="true">
      {l.title.slice(0, 1).toUpperCase()}
    </div>
  );
}

export function View({ data: g, actions, config }: ViewProps<Listings, MapConfig>) {
  const { locale } = actions;
  const [sort, setSort] = useState<SortKey>("match");
  const [picked, setPicked] = useState<number[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const { busy, run } = useBusy();
  const items = g.listings;

  const has = (f: (l: Listing) => unknown) => items.some((l) => f(l) != null);
  const sorts: Array<[SortKey, string]> = [["match", "Best match"]];
  if (has((l) => l.rating)) sorts.push(["rating", "Rating"]);
  if (has((l) => l.distanceKm)) sorts.push(["distance", "Distance"]);
  if (priceSortable(g)) sorts.push(["price", "Price: low to high"]);

  const order = useMemo(() => {
    const idx = items.map((_, i) => i);
    if (sort === "match") return idx;
    const val = (i: number) => (sort === "rating" ? items[i].rating : sort === "distance" ? items[i].distanceKm : items[i].price?.amount);
    return idx.sort((a, b) => {
      const va = val(a);
      const vb = val(b);
      if (va == null) return vb == null ? 0 : 1;
      if (vb == null) return -1;
      return sort === "rating" ? vb - va : va - vb;
    });
  }, [g, sort]);

  const onMap = order.filter((i) => hasPin(items[i]));
  const mapOn = showMap && onMap.length >= 2;
  const toggle = (i: number) => setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));
  const names = () => picked.map((i) => `- ${items[i].title}${where(items[i])}`).join("\n");
  const ask = () => run("ask", () => actions.sendMessage(`Tell me more about these:\n${names()}`));
  const compare = () =>
    run("compare", () => actions.sendMessage(`Compare these and recommend one:\n${names()}\nShow the comparison with show_comparison.`));
  const copy = (i: number, shown: HTMLElement) => void copyText(items[i].phone!, () => shown).then((how) => how === "copied" && setCopied(i));

  const card = (i: number) => {
    const l = items[i];
    const on = picked.includes(i);
    const price = priceText(l, g, locale);
    const distance = distanceText(l, g, locale);
    return (
      <li key={i} className={`pg-card ls-card${on ? " pg-picked" : ""}`}>
        <Photo l={l} />
        <h3 className="pg-name" title={l.title}>
          {l.title}
        </h3>
        {price && (
          <p className="pg-price ls-price">
            {price}
            <Unchecked on={isUnverified(l, "price")} />
          </p>
        )}
        {l.priceNote && <p className="pg-meta ink-muted">{l.priceNote}</p>}
        {l.rating != null && (
          <p className="pg-rating">
            <span aria-hidden="true">★</span> {fmtNumber(l.rating, locale, { maximumFractionDigits: 1 })}
            {l.reviewCount != null && <span className="ink-faint"> ({fmtNumber(l.reviewCount, locale)})</span>}
            <span className="ink-sr"> out of 5</span>
            <Unchecked on={isUnverified(l, "rating")} />
          </p>
        )}
        {l.start && (
          <p className="pg-meta ls-start">
            {fmtDate(l.start, locale)}
            <Unchecked on={isUnverified(l, "start")} />
          </p>
        )}
        {(distance || l.address) && (
          <p className="pg-meta ink-muted ls-wrap">
            {[distance, l.address].filter(Boolean).join(" · ")}
            <Unchecked on={isUnverified(l, "address")} />
          </p>
        )}
        {(l.hours || (l.openNow != null && fresh(g.asOf))) && (
          <p className="pg-meta ink-muted ls-wrap">
            {l.openNow != null && fresh(g.asOf) && <b className={l.openNow ? "ls-open" : ""}>{l.openNow ? "Open now" : "Closed now"}</b>}
            {l.openNow != null && fresh(g.asOf) && l.hours ? " · " : ""}
            {l.hours}
            <Unchecked on={isUnverified(l, "hours") || isUnverified(l, "openNow")} />
          </p>
        )}
        {l.detail && <p className="pg-meta ink-muted ls-wrap">{l.detail}</p>}
        {!!l.badges?.length && (
          <p className="ls-badges">
            {l.badges.map((b) => (
              <Chip key={b}>{b}</Chip>
            ))}
          </p>
        )}
        {l.phone && (
          <p className="pg-meta ls-phone">
            <span>{l.phone}</span>
            <Unchecked on={isUnverified(l, "phone")} />
            <button type="button" className="ink-link" onClick={(e) => copy(i, e.currentTarget.parentElement!.firstElementChild as HTMLElement)} aria-label={`Copy phone number of ${l.title}`}>
              {copied === i ? "Copied" : "Copy"}
            </button>
          </p>
        )}
        <div className="pg-actions ls-actions">
          <Actions item={l} actions={actions} name={l.title} openLabel={OPEN[kindOf(l, g) ?? ""]} copy={["address"]}>
            <label className="pg-pick">
              <input type="checkbox" checked={on} onChange={() => toggle(i)} aria-label={`Shortlist ${l.title}`} />
              <span>Shortlist</span>
            </label>
          </Actions>
        </div>
      </li>
    );
  };

  const last = picked.filter((i) => hasPin(items[i])).pop();
  return (
    <section className="ink-card pg" aria-label={g.title ?? "Listings"}>
      <div className="pg-bar">
        {g.title && <h2 className="ink-title pg-title">{g.title}</h2>}
        <div className="ls-tools">
          {onMap.length >= 2 && (
            <>
              <Button pressed={!mapOn} onClick={() => setShowMap(false)}>
                Grid
              </Button>
              <Button pressed={mapOn} onClick={() => setShowMap(true)}>
                Map
              </Button>
            </>
          )}
          {sorts.length > 1 && (
            <label className="pg-sort">
              <span className="ink-muted">Sort</span>
              <select value={sort} onChange={(e) => setSort((e.target as HTMLSelectElement).value as SortKey)}>
                {sorts.map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </div>
      {mapOn ? (
        <div className="mv-body">
          <MapSurface
            config={config}
            onPick={(pin) => toggle(onMap[pin])}
            pins={onMap.map((i) => {
              const l = items[i] as Listing & { lat: number; lng: number };
              const price = shortPrice(l, locale);
              return { key: l.id ?? `l${i}`, lat: l.lat, lng: l.lng, name: l.title, text: price && price.length <= 8 ? price : undefined, on: picked.includes(i) };
            })}
          />
          <div className="mv-side">
            {onMap.length < items.length && <p className="mv-count ink-muted">{items.length - onMap.length} not on map</p>}
            <ul className="pg-grid ls-one">{last != null ? card(last) : <li className="ink-muted ls-hint">Select a pin to see the listing.</li>}</ul>
          </div>
        </div>
      ) : (
        <ul className="pg-grid ls-grid">{order.map(card)}</ul>
      )}
      <div className="ink-actions">
        <Button disabled={!picked.length || busy !== null} onClick={ask}>
          {busy === "ask" ? "Asking…" : `Ask about selected${picked.length ? ` (${picked.length})` : ""}`}
        </Button>
        <Button disabled={picked.length < 2 || picked.length > 5 || busy !== null} onClick={compare}>
          {busy === "compare" ? "Asking…" : "Compare selected"}
        </Button>
      </div>
      {has((l) => l.price) && (
        <p className="ink-faint ls-note">
          Prices are a snapshot. Check the final price at the site.
        </p>
      )}
      {g.caption && <p className="ink-faint ls-note">{g.caption}</p>}
      <Provenance source={g.source} items={items} asOf={g.asOf} sensitive open={actions.openLink} locale={locale} />
    </section>
  );
}

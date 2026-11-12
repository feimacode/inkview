import { useMemo, useState } from "react";
import type { ViewProps } from "../types.js";
import type { Column, DataTable } from "./schema.js";
import { Button, Chip, HostLink, Source, useBusy } from "../../runtime/primitives.js";
import { fmtDate, fmtMoney, fmtNumber, toNumber } from "../../runtime/format.js";
import { isJourney, journeyFacts, journeyText } from "../journey.js";
import { JourneyCell } from "../JourneyCell.js";
import "./data-table.css";

export function accepts(d: unknown): d is DataTable {
  const t = d as DataTable;
  return !!t && Array.isArray(t.columns) && Array.isArray(t.rows);
}

type Sort = { key: string; dir: "asc" | "desc" } | null;

function linkOf(v: unknown): { label: string; url: string } | null {
  if (typeof v === "string" && /^https?:\/\//.test(v)) return { label: v.replace(/^https?:\/\/(www\.)?/, "").slice(0, 40), url: v };
  if (v && typeof v === "object" && typeof (v as { url?: unknown }).url === "string") {
    const o = v as { url: string; label?: string };
    return { label: o.label ?? o.url, url: o.url };
  }
  return null;
}

/** Plain text of a cell, used for filtering, CSV and messages. */
export function cellText(v: unknown, c: Column, locale: string): string {
  if (v == null) return "";
  switch (c.type) {
    case "money":
      return fmtMoney(v, c.currency, locale);
    case "number":
      return fmtNumber(v, locale);
    case "date":
      return fmtDate(v, locale);
    case "link":
      return linkOf(v)?.label ?? String(v);
    case "journey":
      if (isJourney(v)) return journeyText(v);
    // falls through
    default:
      return typeof v === "object" ? JSON.stringify(v) : String(v);
  }
}

function sortValue(v: unknown, c: Column): number | string | null {
  if (v == null || v === "") return null;
  if (c.type === "number" || c.type === "money") return toNumber(v);
  if (c.type === "journey") return isJourney(v) ? journeyFacts(v).minutes : null;
  if (c.type === "date") {
    const t = new Date(String(v)).getTime();
    return Number.isNaN(t) ? null : t;
  }
  return (linkOf(v)?.label ?? String(v)).toLowerCase();
}

/** Flight or train numbers, so the filter finds "QF25" although the cell does not print it. */
const flightNumbers = (v: unknown) => (isJourney(v) ? ` ${v.segments.map((s) => s.number ?? "").join(" ")}` : "");

const csvEscape = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

export function View({ data: t, actions }: ViewProps<DataTable>) {
  const { locale } = actions;
  const [sort, setSort] = useState<Sort>(null);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const { busy, run } = useBusy();

  const rows = useMemo(() => {
    let idx = t.rows.map((_, i) => i);
    const q = filter.trim().toLowerCase();
    if (q) idx = idx.filter((i) => t.columns.some((c) => (cellText(t.rows[i][c.key], c, locale) + flightNumbers(t.rows[i][c.key])).toLowerCase().includes(q)));
    if (sort) {
      const c = t.columns.find((x) => x.key === sort.key)!;
      idx.sort((a, b) => {
        const va = sortValue(t.rows[a][c.key], c);
        const vb = sortValue(t.rows[b][c.key], c);
        if (va === null) return vb === null ? 0 : 1;
        if (vb === null) return -1;
        const r = va < vb ? -1 : va > vb ? 1 : 0;
        return sort.dir === "asc" ? r : -r;
      });
    }
    return idx;
  }, [t, filter, sort, locale]);

  const toggleSort = (key: string) =>
    setSort((s) => (s?.key !== key ? { key, dir: "asc" } : s.dir === "asc" ? { key, dir: "desc" } : null));
  const toggleRow = (i: number) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });

  const summary = (i: number) =>
    t.columns
      .slice(0, 4)
      .map((c) => `${c.label}: ${cellText(t.rows[i][c.key], c, locale)}`)
      .join(", ");

  const askSelected = () =>
    run("ask", () =>
      actions.sendMessage(
        `Tell me more about these ${selected.size} rows${t.title ? ` from "${t.title}"` : ""}:\n${[...selected]
          .sort((a, b) => a - b)
          .map((i) => `- ${summary(i)}`)
          .join("\n")}`,
      ),
    );

  const downloadCsv = () =>
    run("csv", () => {
      const lines = [t.columns.map((c) => csvEscape(c.label)).join(",")];
      for (const i of rows) lines.push(t.columns.map((c) => csvEscape(cellText(t.rows[i][c.key], c, locale))).join(","));
      const name = (t.title ?? "table").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "table";
      return actions.download!(`${name}.csv`, "text/csv", lines.join("\n"));
    });

  const renderCell = (v: unknown, c: Column) => {
    if (v == null || v === "") return <span className="ink-faint">–</span>;
    if (c.type === "link") {
      const l = linkOf(v);
      return l ? <HostLink href={l.url} open={actions.openLink}>{l.label}</HostLink> : String(v);
    }
    if (c.type === "badge") return <Chip>{String(v)}</Chip>;
    if (c.type === "journey" && isJourney(v)) return <JourneyCell journey={v} />;
    return cellText(v, c, locale);
  };

  return (
    <section className="ink-card dt" aria-label={t.title ?? "Table"}>
      <div className="dt-bar">
        {t.title && <h2 className="ink-title dt-title">{t.title}</h2>}
        <input
          className="dt-filter"
          type="search"
          placeholder="Filter"
          aria-label="Filter rows"
          value={filter}
          onChange={(e) => setFilter((e.target as HTMLInputElement).value)}
        />
      </div>
      <div className="dt-scroll" tabIndex={0} aria-label="Table, scrolls horizontally">
        <table>
          <thead>
            <tr>
              <th className="dt-check" scope="col">
                <span className="ink-sr">Select</span>
              </th>
              {t.columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={c.type === "number" || c.type === "money" ? "dt-num" : undefined}
                  aria-sort={sort?.key === c.key ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
                >
                  <button type="button" onClick={() => toggleSort(c.key)}>
                    {c.label}
                    <span aria-hidden="true" className="dt-arrow">
                      {sort?.key === c.key ? (sort.dir === "asc" ? "↑" : "↓") : "↕"}
                    </span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((i) => (
              <tr key={i} className={selected.has(i) ? "dt-selected" : undefined}>
                <td className="dt-check">
                  <input
                    type="checkbox"
                    aria-label={`Select row ${i + 1}`}
                    checked={selected.has(i)}
                    onChange={() => toggleRow(i)}
                  />
                </td>
                {t.columns.map((c) => (
                  <td key={c.key} className={c.type === "number" || c.type === "money" ? "dt-num" : undefined}>
                    {renderCell(t.rows[i][c.key], c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="ink-state">No rows match "{filter}".</p>}
      </div>
      {t.caption && <p className="dt-caption ink-muted">{t.caption}</p>}
      <div className="ink-actions">
        <Button primary disabled={selected.size === 0 || busy !== null} onClick={askSelected}>
          {busy === "ask" ? "Asking…" : `Ask about selected${selected.size ? ` (${selected.size})` : ""}`}
        </Button>
        {actions.download && (
          <Button disabled={busy !== null} onClick={downloadCsv}>
            Download CSV
          </Button>
        )}
      </div>
      <Source source={t.source} open={actions.openLink} />
    </section>
  );
}

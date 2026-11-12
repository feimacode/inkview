import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import type { ViewProps } from "../types.js";
import type { Chart } from "./schema.js";
import { Provenance } from "../../runtime/primitives.js";
import { fmtNumber } from "../../runtime/format.js";
import { summarize } from "./markdown.js";
import "./chart.css";

export function accepts(d: unknown): d is Chart {
  const c = d as Chart;
  return !!c && (c.kind === "line" || c.kind === "bar") && Array.isArray(c.x) && Array.isArray(c.series);
}

const H = 240;
const M = { top: 12, right: 12, bottom: 28, left: 48 };

function niceTicks(min: number, max: number, count = 5): number[] {
  if (min === max) {
    min = min === 0 ? 0 : min * 0.9;
    max = max === 0 ? 1 : max * 1.1;
  }
  const raw = (max - min) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw)!;
  const ticks: number[] = [];
  for (let v = Math.floor(min / step) * step; v <= max + step * 1e-9; v += step) ticks.push(+v.toFixed(10));
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}

const isIsoDate = (s: string) => /^\d{4}-\d{2}(-\d{2})?/.test(s) && !Number.isNaN(Date.parse(s));

export function View({ data: c, actions }: ViewProps<Chart>) {
  const { locale } = actions;
  const wrap = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(600);
  const [hidden, setHidden] = useState<Set<number>>(new Set());
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(Math.max(260, el.clientWidth)));
    ro.observe(el);
    setW(Math.max(260, el.clientWidth));
    return () => ro.disconnect();
  }, []);

  const dates = c.x.every(isIsoDate);
  const xLabel = (s: string) => {
    if (!dates) return s;
    try {
      return new Intl.DateTimeFormat(locale, s.length > 7 ? { month: "short", day: "numeric" } : { month: "short", year: "2-digit" }).format(new Date(s));
    } catch {
      return s;
    }
  };
  const fmt = (v: number | null | undefined) => (v == null ? "–" : `${fmtNumber(v, locale)}${c.unit ? ` ${c.unit}` : ""}`);

  const visible = c.series.map((_, i) => !hidden.has(i));
  const { ticks, y } = useMemo(() => {
    const vals = c.series.flatMap((s, i) => (visible[i] ? s.values.filter((v): v is number => v != null) : []));
    let lo = vals.length ? Math.min(...vals) : 0;
    let hi = vals.length ? Math.max(...vals) : 1;
    if (c.kind === "bar") {
      lo = Math.min(0, lo);
      hi = Math.max(0, hi);
    }
    const ticks = niceTicks(lo, hi);
    const t0 = ticks[0];
    const t1 = ticks[ticks.length - 1];
    const ih = H - M.top - M.bottom;
    return { ticks, y: (v: number) => M.top + ih - ((v - t0) / (t1 - t0 || 1)) * ih };
  }, [c, hidden]);

  const iw = W - M.left - M.right;
  const n = c.x.length;
  const band = iw / n;
  const xc = (i: number) => (c.kind === "bar" ? M.left + band * (i + 0.5) : M.left + (n === 1 ? iw / 2 : (iw * i) / (n - 1)));
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 64))));
  const visCount = visible.filter(Boolean).length;

  const toggle = (i: number) =>
    setHidden((h) => {
      const next = new Set(h);
      if (next.has(i)) next.delete(i);
      else if (c.series.length - next.size > 1) next.add(i);
      return next;
    });

  const onMove = (e: MouseEvent<SVGSVGElement>) => {
    const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = c.kind === "bar" ? Math.floor((px - M.left) / band) : Math.round(((px - M.left) / iw) * (n - 1));
    setActive(Math.max(0, Math.min(n - 1, i)));
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      setActive((a) => Math.max(0, Math.min(n - 1, (a ?? (e.key === "ArrowRight" ? -1 : n)) + (e.key === "ArrowRight" ? 1 : -1))));
    } else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(n - 1);
  };

  const summary = summarize(c);
  const tooltip =
    active == null
      ? ""
      : `${xLabel(c.x[active])}: ${c.series
          .filter((_, i) => visible[i])
          .map((s) => `${s.name} ${fmt(s.values[active])}`)
          .join(", ")}`;

  return (
    <figure className="ink-card ch" aria-label={c.title ?? "Chart"}>
      {c.title && <h2 className="ink-title">{c.title}</h2>}
      {c.series.length > 1 && (
        <div className="ch-legend" role="group" aria-label="Series">
          {c.series.map((s, i) => (
            <button
              key={s.name}
              type="button"
              className="ch-key"
              aria-pressed={visible[i]}
              onClick={() => toggle(i)}
              disabled={visible[i] && visCount === 1}
            >
              <span className={`ch-swatch ch-s${i}`} aria-hidden="true" />
              {s.name}
            </button>
          ))}
        </div>
      )}
      <div
        ref={wrap}
        className="ch-plot"
        tabIndex={0}
        aria-label={`${summary} Use the left and right arrow keys to read values.`}
        onKeyDown={onKey}
        onBlur={() => setActive(null)}
      >
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" onMouseMove={onMove} onMouseLeave={() => setActive(null)}>
          {ticks.map((t) => (
            <g key={t}>
              <line className="ch-grid" x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} />
              <text className="ch-tick" x={M.left - 6} y={y(t)} dy="0.32em" textAnchor="end">
                {fmtNumber(t, locale, { notation: Math.abs(t) >= 10000 ? "compact" : "standard" })}
              </text>
            </g>
          ))}
          {c.x.map((x, i) =>
            i % labelEvery === 0 ? (
              <text key={i} className="ch-tick" x={xc(i)} y={H - M.bottom + 16} textAnchor="middle">
                {xLabel(x)}
              </text>
            ) : null,
          )}
          {c.kind === "bar"
            ? c.series.map((s, si) => {
                if (!visible[si]) return null;
                const vis = c.series.map((_, k) => k).filter((k) => visible[k]);
                const slot = vis.indexOf(si);
                const bw = Math.max(2, (band * 0.75) / vis.length);
                const zero = y(Math.max(ticks[0], 0));
                return s.values.map((v, i) =>
                  v == null ? null : (
                    <rect
                      key={`${si}-${i}`}
                      className={`ch-bar ch-s${si}${active === i ? " ch-on" : ""}`}
                      x={M.left + band * i + band * 0.125 + slot * bw}
                      width={bw - 1}
                      y={Math.min(y(v), zero)}
                      height={Math.max(1, Math.abs(zero - y(v)))}
                      rx={2}
                    />
                  ),
                );
              })
            : c.series.map((s, si) => {
                if (!visible[si]) return null;
                let d = "";
                s.values.forEach((v, i) => {
                  if (v == null) return;
                  d += `${d && s.values[i - 1] != null ? "L" : "M"}${xc(i).toFixed(1)},${y(v).toFixed(1)}`;
                });
                return (
                  <g key={si}>
                    <path className={`ch-line ch-s${si}`} d={d} />
                    {active != null && s.values[active] != null && (
                      <circle className={`ch-dot ch-s${si}`} cx={xc(active)} cy={y(s.values[active]!)} r={4} />
                    )}
                  </g>
                );
              })}
          {active != null && c.kind === "line" && <line className="ch-cursor" x1={xc(active)} x2={xc(active)} y1={M.top} y2={H - M.bottom} />}
        </svg>
        {active != null && (
          <div className="ch-tip" style={{ left: `${Math.min(Math.max(xc(active) / W, 0.15), 0.85) * 100}%` }}>
            <strong>{xLabel(c.x[active])}</strong>
            {c.series.map((s, i) =>
              visible[i] ? (
                <span key={s.name}>
                  <span className={`ch-swatch ch-s${i}`} aria-hidden="true" /> {s.name}: {fmt(s.values[active])}
                </span>
              ) : null,
            )}
          </div>
        )}
      </div>
      <p className="ink-sr" aria-live="polite">
        {tooltip}
      </p>
      {(c.xLabel || c.yLabel) && (
        <figcaption className="ch-axes ink-faint">{[c.yLabel && `Y: ${c.yLabel}`, c.xLabel && `X: ${c.xLabel}`].filter(Boolean).join(" · ")}</figcaption>
      )}
      <Provenance source={c.source} open={actions.openLink} locale={actions.locale} />
    </figure>
  );
}

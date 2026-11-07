import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import type { ViewProps } from "../types.js";
import type { MapConfig } from "./config.js";
import type { MapData } from "./schema.js";
import { Button, Source, useBusy } from "../../runtime/primitives.js";
import {
  clamp,
  constrain,
  fitView,
  mapsUrl,
  pixelsPerWorldUnit,
  project,
  tileUrl,
  zoomAround,
  type Point,
  type Viewport,
} from "./project.js";
import "./map.css";

const keyOf = (place: MapData["places"][number], index: number) => place.id ?? `place-${index}`;

export function accepts(d: unknown): d is MapData {
  const map = d as MapData;
  return (
    !!map &&
    typeof map === "object" &&
    Array.isArray(map.places) &&
    map.places.length > 0 &&
    map.places.length <= 50 &&
    map.places.every(
      (place) =>
        place &&
        typeof place === "object" &&
        typeof place.label === "string" &&
        typeof place.lat === "number" &&
        Number.isFinite(place.lat) &&
        typeof place.lng === "number" &&
        Number.isFinite(place.lng),
    )
  );
}

export function View({ data, actions, config }: ViewProps<MapData, MapConfig>) {
  const template = config?.tileTemplate ?? null;
  const attribution = config?.attribution ?? "";
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [view, setView] = useState<Viewport>({ zoom: 1, center: { x: 0.5, y: 0.5 } });
  const [picked, setPicked] = useState<number[]>([]);
  const [tilesFailed, setTilesFailed] = useState(false);
  const { busy, run } = useBusy();

  const points = useMemo(() => data.places.map((place) => project(place.lat, place.lng)), [data.places]);
  const dataKey = useMemo(() => points.map((p) => `${p.x},${p.y}`).join("|"), [points]);

  const viewRef = useRef(view);
  viewRef.current = view;

  useEffect(() => {
    const el = surfaceRef.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!size.w || !size.h) return;
    setView(fitView(points, size.w, size.h));
    setTilesFailed(false);
  }, [dataKey, size.w, size.h]);

  useEffect(() => setPicked([]), [dataKey]);
  useEffect(() => setTilesFailed(false), [template]);

  useEffect(() => {
    const el = surfaceRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = el.getBoundingClientRect();
      const factor = clamp(Math.exp(-event.deltaY * 0.0015), 0.5, 2);
      setView((current) =>
        zoomAround(current, event.clientX - rect.left, event.clientY - rect.top, current.zoom + Math.log2(factor), size.w, size.h),
      );
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [size.w, size.h]);

  const pointers = useRef(new Map<number, Point>());
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);
  const pinch = useRef<{ distance: number; zoom: number } | null>(null);

  const pointerDistance = () => {
    const [a, b] = Array.from(pointers.current.values());
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button")) return;
    surfaceRef.current?.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 1) drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    if (pointers.current.size === 2) {
      drag.current = null;
      pinch.current = { distance: pointerDistance(), zoom: viewRef.current.zoom };
    }
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const pointer = pointers.current.get(event.pointerId);
    if (!pointer) return;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    if (pointers.current.size >= 2) {
      const distance = pointerDistance();
      if (pinch.current && distance > 0 && pinch.current.distance > 0) {
        const zoom = pinch.current.zoom + Math.log2(distance / pinch.current.distance);
        setView((current) => zoomAround(current, size.w / 2, size.h / 2, zoom, size.w, size.h));
      }
      return;
    }
    if (drag.current?.id !== event.pointerId) return;
    const dx = event.clientX - drag.current.x;
    const dy = event.clientY - drag.current.y;
    if (Math.abs(dx) + Math.abs(dy) < 2) return;
    const scale = pixelsPerWorldUnit(viewRef.current.zoom);
    setView((current) => ({
      zoom: current.zoom,
      center: constrain({ x: current.center.x - dx / scale, y: current.center.y - dy / scale }),
    }));
    drag.current.x = event.clientX;
    drag.current.y = event.clientY;
  };

  const endPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (drag.current?.id === event.pointerId) drag.current = null;
  };

  const zoomBy = (levels: number) =>
    setView((current) => zoomAround(current, size.w / 2, size.h / 2, current.zoom + levels, size.w, size.h));

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const scale = pixelsPerWorldUnit(viewRef.current.zoom);
    const step = 80 / scale;
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      zoomBy(1);
    } else if (event.key === "-" || event.key === "_") {
      event.preventDefault();
      zoomBy(-1);
    } else if (event.key.startsWith("Arrow")) {
      event.preventDefault();
      const delta = { x: 0, y: 0 };
      if (event.key === "ArrowLeft") delta.x = -step;
      if (event.key === "ArrowRight") delta.x = step;
      if (event.key === "ArrowUp") delta.y = -step;
      if (event.key === "ArrowDown") delta.y = step;
      setView((current) => ({
        zoom: current.zoom,
        center: constrain({ x: current.center.x + delta.x, y: current.center.y + delta.y }),
      }));
    }
  };

  const toggle = (index: number) => {
    const chosen = picked.includes(index);
    setPicked(chosen ? picked.filter((i) => i !== index) : [...picked, index]);
    if (!chosen) {
      const point = points[index];
      setView((current) => ({ zoom: current.zoom, center: constrain(point) }));
    }
  };

  const tiles = useMemo(() => {
    if (!template || tilesFailed || !size.w || !size.h) return [];
    const tileZoom = clamp(Math.floor(view.zoom), 0, 19);
    const count = 2 ** tileZoom;
    const scale = pixelsPerWorldUnit(view.zoom);
    const left = view.center.x - size.w / (2 * scale);
    const right = view.center.x + size.w / (2 * scale);
    const top = view.center.y - size.h / (2 * scale);
    const bottom = view.center.y + size.h / (2 * scale);
    const x0 = Math.floor(left * count);
    const x1 = Math.floor(right * count);
    const y0 = Math.max(0, Math.floor(top * count));
    const y1 = Math.min(count - 1, Math.floor(bottom * count));
    const tileSize = scale / count;
    const out: Array<{ key: string; src: string; left: number; top: number; size: number }> = [];
    for (let y = y0; y <= y1; y += 1) {
      for (let x = x0; x <= x1; x += 1) {
        const wrapped = ((x % count) + count) % count;
        out.push({
          key: `${tileZoom}/${x}/${y}`,
          src: tileUrl(template, tileZoom, wrapped, y),
          left: size.w / 2 + (x / count - view.center.x) * scale,
          top: size.h / 2 + (y / count - view.center.y) * scale,
          size: tileSize,
        });
      }
    }
    return out;
  }, [template, tilesFailed, size.w, size.h, view]);

  const selected = picked.length ? picked[picked.length - 1] : null;
  const selectedPlace = selected === null ? undefined : data.places[selected];
  const selectedPoint = selected === null ? undefined : points[selected];
  const pickedPlaces = picked.map((index) => data.places[index]);
  const askText = pickedPlaces
    .map((place) => `${place.label}${place.address ? ` at ${place.address}` : ""} (${place.lat}, ${place.lng})`)
    .join("; ");

  return (
    <article className="ink-card mv" aria-label={data.title ?? "Map"}>
      {data.title && <h2 className="ink-title">{data.title}</h2>}
      <div className="mv-body">
        <div
          ref={surfaceRef}
          className="mv-map"
          role="application"
          tabIndex={0}
          aria-label="Interactive map. Drag to pan, use plus and minus to zoom, or the arrow keys to move."
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
          onKeyDown={onKeyDown}
        >
          {(!template || tilesFailed) && <div className="mv-grid" aria-hidden="true" />}
          {tiles.map((tile) => (
            <img
              key={tile.key}
              className="mv-tile"
              src={tile.src}
              alt=""
              draggable={false}
              style={{ left: tile.left, top: tile.top, width: tile.size, height: tile.size }}
              onError={() => setTilesFailed(true)}
            />
          ))}
          {size.w > 0 &&
            data.places.map((place, index) => {
              const pixel = {
                left: size.w / 2 + (points[index].x - view.center.x) * pixelsPerWorldUnit(view.zoom),
                top: size.h / 2 + (points[index].y - view.center.y) * pixelsPerWorldUnit(view.zoom),
              };
              return (
                <button
                  key={keyOf(place, index)}
                  type="button"
                  className="mv-pin"
                  style={{ left: pixel.left, top: pixel.top }}
                  aria-label={`${place.label}, ${place.lat}, ${place.lng}`}
                  aria-pressed={picked.includes(index)}
                  onClick={() => toggle(index)}
                >
                  <span className="mv-pin-dot" aria-hidden="true" />
                </button>
              );
            })}
          <div className="mv-controls">
            <Button onClick={() => zoomBy(1)} label="Zoom in">
              +
            </Button>
            <Button onClick={() => zoomBy(-1)} label="Zoom out">
              −
            </Button>
            <Button onClick={() => setView(fitView(points, size.w, size.h))} label="Fit all places">
              Fit
            </Button>
          </div>
          {template && attribution && <p className="mv-attrib">{attribution}</p>}
        </div>

        <div className="mv-side">
          <ol className="mv-list" aria-label="Places">
            {data.places.map((place, index) => (
              <li key={keyOf(place, index)}>
                <button
                  type="button"
                  className="mv-item"
                  aria-pressed={picked.includes(index)}
                  onClick={() => toggle(index)}
                  onDoubleClick={() => actions.openLink(mapsUrl(place.label, place.lat, place.lng))}
                >
                  <span className="mv-item-label">{place.label}</span>
                  {place.category && <span className="ink-chip">{place.category}</span>}
                  {place.address && <span className="mv-item-address">{place.address}</span>}
                </button>
              </li>
            ))}
          </ol>

          {selectedPlace && selectedPoint && (
            <div className="mv-detail" aria-live="polite">
              <h3 className="mv-detail-title">{selectedPlace.label}</h3>
              <p className="mv-coords">
                {selectedPlace.lat}, {selectedPlace.lng}
              </p>
              {selectedPlace.address && <p className="mv-address">{selectedPlace.address}</p>}
              {selectedPlace.detail && <p className="mv-detail-text">{selectedPlace.detail}</p>}
              <div className="ink-actions">
                <Button primary onClick={() => actions.openLink(mapsUrl(selectedPlace.label, selectedPlace.lat, selectedPlace.lng))}>
                  Open in maps
                </Button>
                <Button
                  disabled={busy !== null}
                  onClick={() => run("ask", () => actions.sendMessage(`Tell me about ${askText}.`))}
                >
                  {busy === "ask" ? "Asking…" : "Ask about selected"}
                </Button>
                {selectedPlace.url && (
                  <Button onClick={() => actions.openLink(selectedPlace.url!)}>Open page</Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {data.caption && <p className="ink-faint mv-caption">{data.caption}</p>}
      <Source source={data.source} open={actions.openLink} />
    </article>
  );
}

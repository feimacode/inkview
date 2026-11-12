import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import type { MapConfig } from "./config.js";
import { Button } from "../../runtime/primitives.js";
import { clamp, constrain, fitView, pixelsPerWorldUnit, project, tileUrl, toPixel, zoomAround, type Point, type Viewport } from "./project.js";
import "./map.css";

export interface Pin {
  key: string;
  lat: number;
  lng: number;
  /** Accessible name. */
  name: string;
  /** Short text drawn on the pin (a price, a stop number). Never sent in tile requests. */
  text?: string;
  on?: boolean;
}

/**
 * The raster tile layer with pins: fit-to-bounds, pan and zoom by pointer,
 * touch and keyboard, and the neutral-grid fallback. Shared by every view that
 * shows a map.
 */
export function MapSurface({
  pins,
  config,
  onPick,
  focus,
}: {
  pins: Pin[];
  config?: MapConfig;
  onPick(index: number): void;
  /** Centers the map on a pin; change `tick` to center on the same pin again. */
  focus?: { index: number; tick: number } | null;
}) {
  const template = config?.tileTemplate ?? null;
  const attribution = config?.attribution ?? "";
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [view, setView] = useState<Viewport>({ zoom: 1, center: { x: 0.5, y: 0.5 } });
  const [tilesFailed, setTilesFailed] = useState(false);

  const points = useMemo(() => pins.map((pin) => project(pin.lat, pin.lng)), [pins]);
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

  useEffect(() => {
    const point = focus ? points[focus.index] : undefined;
    if (point) setView((current) => ({ zoom: current.zoom, center: constrain(point) }));
  }, [focus?.index, focus?.tick]);

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

  return (
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
          pins.map((pin, index) => {
            const pixel = toPixel(points[index], view, size.w, size.h);
            return (
              <button
                key={pin.key}
                type="button"
                className={pin.text ? "mv-pin mv-pin--tag" : "mv-pin"}
                style={{ left: pixel.left, top: pixel.top }}
                aria-label={`${pin.name}, ${pin.lat}, ${pin.lng}`}
                aria-pressed={!!pin.on}
                onClick={() => onPick(index)}
              >
                {pin.text ? <span className="mv-pin-tag">{pin.text}</span> : <span className="mv-pin-dot" aria-hidden="true" />}
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
  );
}

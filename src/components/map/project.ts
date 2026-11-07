/**
 * Web Mercator projection in normalized world coordinates (0..1 across the
 * world). The view keeps its centre in these units and its zoom as a scale, so
 * fit-to-bounds, panning and zooming are plain arithmetic.
 */
export interface Point {
  x: number;
  y: number;
}

export interface Viewport {
  /** Fractional zoom: 256 * 2^zoom pixels span the world. */
  zoom: number;
  center: Point;
}

export const MIN_ZOOM = 0;
export const MAX_ZOOM = 18;
const MAX_LAT = 85.05112878;

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function project(lat: number, lng: number): Point {
  const x = (clamp(lng, -180, 180) + 180) / 360;
  const s = Math.sin((clamp(lat, -MAX_LAT, MAX_LAT) * Math.PI) / 180);
  const y = 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI);
  return { x, y };
}

/** Keeps longitude in range by wrapping and latitude inside the projected world. */
export function constrain(center: Point): Point {
  return { x: ((center.x % 1) + 1) % 1, y: clamp(center.y, 0, 1) };
}

export const pixelsPerWorldUnit = (zoom: number) => 256 * 2 ** zoom;

/** Pixel position of a world point inside a viewport of the given size. */
export function toPixel(point: Point, view: Viewport, width: number, height: number) {
  const scale = pixelsPerWorldUnit(view.zoom);
  return {
    left: width / 2 + (point.x - view.center.x) * scale,
    top: height / 2 + (point.y - view.center.y) * scale,
  };
}

/** Zoom and centre that show every place with room for a pin at the edge. */
export function fitView(points: Point[], width: number, height: number, padding = 48): Viewport {
  if (points.length === 0) return { zoom: 1, center: { x: 0.5, y: 0.5 } };
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = Math.max(maxX - minX, 1e-6);
  const spanY = Math.max(maxY - minY, 1e-6);
  const roomX = Math.max(width - padding * 2, 32);
  const roomY = Math.max(height - padding * 2, 32);
  const zoom = clamp(Math.floor(Math.log2(Math.min(roomX / (256 * spanX), roomY / (256 * spanY)))), MIN_ZOOM, 16);
  return { zoom, center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 } };
}

/** Zooms so the world point under a pixel anchor stays under it. */
export function zoomAround(view: Viewport, anchorX: number, anchorY: number, zoom: number, width: number, height: number): Viewport {
  const next = clamp(zoom, MIN_ZOOM, MAX_ZOOM);
  const from = pixelsPerWorldUnit(view.zoom);
  const to = pixelsPerWorldUnit(next);
  const worldX = view.center.x + (anchorX - width / 2) / from;
  const worldY = view.center.y + (anchorY - height / 2) / from;
  return {
    zoom: next,
    center: constrain({
      x: worldX - (anchorX - width / 2) / to,
      y: worldY - (anchorY - height / 2) / to,
    }),
  };
}

/** Tile URL for one coordinate. Only z, x, y and an optional s are substituted. */
export function tileUrl(template: string, z: number, x: number, y: number): string {
  return template
    .replace("{z}", String(z))
    .replace("{x}", String(x))
    .replace("{y}", String(y))
    .replace("{s}", "abc"[(x + y) % 3]);
}

/** A map search page for one place, opened by the host. */
export function mapsUrl(label: string, lat: number, lng: number): string {
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(`${label} ${lat},${lng}`)}`;
}

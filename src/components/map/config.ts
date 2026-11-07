/**
 * Tile provider configuration. The tile template and attribution are read from
 * the environment, so moving providers is a deployment change, not a code change.
 */

export const DEFAULT_TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const DEFAULT_ATTRIBUTION = "© OpenStreetMap contributors";

export interface MapConfig {
  /** Raster tile URL template with {z}, {x} and {y}; null when tiles are off. */
  tileTemplate: string | null;
  attribution: string;
}

export function tileTemplate(env: NodeJS.ProcessEnv = process.env): string | null {
  const value = env.INKVIEW_MAP_TILES?.trim();
  if (!value) return DEFAULT_TILES;
  return value.toLowerCase() === "off" ? null : value;
}

export function mapConfig(env: NodeJS.ProcessEnv = process.env): MapConfig {
  return {
    tileTemplate: tileTemplate(env),
    attribution: env.INKVIEW_MAP_ATTRIBUTION?.trim() || DEFAULT_ATTRIBUTION,
  };
}

/** Origins the UI resource CSP must allow for tiles. Empty when tiles are off. */
export function tileDomains(env: NodeJS.ProcessEnv = process.env): string[] {
  const template = tileTemplate(env);
  if (!template) return [];
  const match = template.match(/^(https?):\/\/([^/]+)/i);
  if (!match) return [];
  const [, scheme, raw] = match;
  const host = raw.replace(/\{s\}/i, "*").replace(/\{[^}]+\}/g, "0");
  const check = host.replace("*", "tile");
  if (!/^[a-z0-9.-]+(:\d+)?$/i.test(check)) return [];
  return [`${scheme.toLowerCase()}://${host}`];
}

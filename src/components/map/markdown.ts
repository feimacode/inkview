import { mdSource } from "../md.js";
import type { MapData } from "./schema.js";

/** Decimal degrees trimmed to 5 places, without trailing zeros. */
const coord = (value: number) => value.toFixed(5).replace(/\.?0+$/, "") || "0";

export function toMarkdown(map: MapData): string {
  const lines = map.title ? [`### ${map.title}`, ""] : [];
  map.places.forEach((place, index) => {
    const label = place.url ? `[${place.label}](${place.url})` : `**${place.label}**`;
    const parts = [label];
    if (place.address) parts.push(place.address);
    parts.push(`${coord(place.lat)}, ${coord(place.lng)}`);
    lines.push(`${index + 1}. ${parts.join(" — ")}`);
  });
  if (map.caption) lines.push("", `_${map.caption}_`);
  const source = mdSource(map.source);
  if (source) lines.push("", source);
  return lines.join("\n");
}

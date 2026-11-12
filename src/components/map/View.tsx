import { useEffect, useMemo, useState } from "react";
import type { ViewProps } from "../types.js";
import type { MapConfig } from "./config.js";
import type { MapData, MapPlace } from "./schema.js";
import { Button, Source, useBusy } from "../../runtime/primitives.js";
import { mapsUrl } from "./project.js";
import { MapSurface, type Pin } from "./Surface.js";

const keyOf = (place: MapPlace, index: number) => place.id ?? `place-${index}`;
const num = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
export const pinned = (place: { lat?: number; lng?: number }): place is { lat: number; lng: number } => num(place.lat) && num(place.lng);

export function accepts(d: unknown): d is MapData {
  const map = d as MapData;
  return (
    !!map &&
    typeof map === "object" &&
    Array.isArray(map.places) &&
    map.places.length > 0 &&
    map.places.every(
      (place) => place && typeof place === "object" && typeof place.label === "string" && (pinned(place) || typeof place.address === "string"),
    )
  );
}

export function View({ data, actions, config }: ViewProps<MapData, MapConfig>) {
  const [picked, setPicked] = useState<number[]>([]);
  const [focus, setFocus] = useState<{ index: number; tick: number } | null>(null);
  const { busy, run } = useBusy();

  // Places with coordinates first; the rest are listed as not on the map.
  const order = useMemo(() => {
    const all = data.places.map((_, index) => index);
    return [...all.filter((i) => pinned(data.places[i])), ...all.filter((i) => !pinned(data.places[i]))];
  }, [data.places]);
  const onMap = useMemo(() => order.filter((i) => pinned(data.places[i])), [order, data.places]);
  useEffect(() => setPicked([]), [data.places]);

  const toggle = (index: number) => {
    const chosen = picked.includes(index);
    setPicked(chosen ? picked.filter((i) => i !== index) : [...picked, index]);
    const pin = onMap.indexOf(index);
    if (!chosen && pin >= 0) setFocus({ index: pin, tick: Date.now() });
  };

  const pins: Pin[] = onMap.map((i) => {
    const place = data.places[i] as MapPlace & { lat: number; lng: number };
    return { key: keyOf(place, i), lat: place.lat, lng: place.lng, name: place.label, text: place.pinLabel, on: picked.includes(i) };
  });

  const selected = picked.length ? picked[picked.length - 1] : null;
  const selectedPlace = selected === null ? undefined : data.places[selected];
  const askText = picked
    .map((index) => data.places[index])
    .map((place) => `${place.label}${place.address ? ` at ${place.address}` : ""}${pinned(place) ? ` (${place.lat}, ${place.lng})` : ""}`)
    .join("; ");
  const total = data.places.length;

  return (
    <article className="ink-card mv" aria-label={data.title ?? "Map"}>
      {data.title && <h2 className="ink-title">{data.title}</h2>}
      <div className={onMap.length ? "mv-body" : "mv-body mv-body--list"}>
        {onMap.length > 0 ? (
          <MapSurface pins={pins} config={config} onPick={(pin) => toggle(onMap[pin])} focus={focus} />
        ) : (
          <p className="mv-note ink-muted">These places have no coordinates, so they are shown as a list.</p>
        )}

        <div className="mv-side">
          {onMap.length > 0 && onMap.length < total && (
            <p className="mv-count ink-muted">
              {onMap.length} of {total} on map
            </p>
          )}
          <ol className="mv-list" aria-label="Places">
            {order.map((index) => {
              const place = data.places[index];
              return (
                <li key={keyOf(place, index)}>
                  <button
                    type="button"
                    className="mv-item"
                    aria-pressed={picked.includes(index)}
                    onClick={() => toggle(index)}
                    onDoubleClick={() => actions.openLink(mapsUrl(place))}
                  >
                    <span className="mv-item-label">{place.label}</span>
                    {place.category && <span className="ink-chip">{place.category}</span>}
                    {onMap.length > 0 && !pinned(place) && <span className="ink-chip mv-off">Not on map</span>}
                    {place.address && <span className="mv-item-address">{place.address}</span>}
                  </button>
                </li>
              );
            })}
          </ol>

          {selectedPlace && (
            <div className="mv-detail" aria-live="polite">
              <h3 className="mv-detail-title">{selectedPlace.label}</h3>
              {pinned(selectedPlace) && (
                <p className="mv-coords">
                  {selectedPlace.lat}, {selectedPlace.lng}
                </p>
              )}
              {selectedPlace.address && <p className="mv-address">{selectedPlace.address}</p>}
              {selectedPlace.detail && <p className="mv-detail-text">{selectedPlace.detail}</p>}
              <div className="ink-actions">
                <Button primary onClick={() => actions.openLink(mapsUrl(selectedPlace))}>
                  Open in maps
                </Button>
                <Button disabled={busy !== null} onClick={() => run("ask", () => actions.sendMessage(`Tell me about ${askText}.`))}>
                  {busy === "ask" ? "Asking…" : "Ask about selected"}
                </Button>
                {selectedPlace.url && <Button onClick={() => actions.openLink(selectedPlace.url!)}>Open page</Button>}
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

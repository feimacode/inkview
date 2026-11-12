import { useState } from "react";
import type { ViewActions, ViewProps } from "../types.js";
import type { ProfileGrid } from "./schema.js";
import type { ProfileCard } from "../profile-card/schema.js";
import { View as ProfileCardView } from "../profile-card/View.js";
import { Avatar, Button, Provenance, useBusy } from "../../runtime/primitives.js";
import "./profile-grid.css";

export function accepts(d: unknown): d is ProfileGrid {
  return !!d && Array.isArray((d as ProfileGrid).people);
}

function lineFor(p: ProfileCard): string {
  return `- ${p.name}${p.headline ? ` (${p.headline})` : ""}${p.profileUrl ? `, ${p.profileUrl}` : ""}`;
}

export function View({ data: g, actions }: ViewProps<ProfileGrid>) {
  const { busy, run } = useBusy();
  const [selected, setSelected] = useState<number[]>([]);
  const [shortlist, setShortlist] = useState<number[]>([]);
  const [open, setOpen] = useState<number | null>(null);

  const toggle = (i: number) => setSelected((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));

  const contextFor = (indexes: number[]) =>
    indexes.length
      ? `The user's shortlist now has ${indexes.length} ${indexes.length === 1 ? "person" : "people"}:\n${indexes.map((i) => lineFor(g.people[i])).join("\n")}`
      : null;

  const ask = () =>
    run("ask", () =>
      actions.sendMessage(
        `Tell me about these ${selected.length} people from the list and what they have in common:\n${selected
          .map((i) => lineFor(g.people[i]))
          .join("\n")}`,
      ),
    );

  const addToShortlist = () =>
    run("shortlist", async () => {
      const next = [...shortlist, ...selected.filter((i) => !shortlist.includes(i))];
      await actions.setModelContext!(contextFor(next));
      setShortlist(next);
      setSelected([]);
    });

  const removeFromShortlist = (i: number) =>
    run(`remove-${i}`, async () => {
      const next = shortlist.filter((x) => x !== i);
      await actions.setModelContext!(contextFor(next));
      setShortlist(next);
    });

  if (open !== null) {
    const index = open;
    // The full profile reuses the profile card; its shortlist button updates this list.
    const cardActions: ViewActions = actions.setModelContext
      ? {
          ...actions,
          setModelContext: async (text: string | null) => {
            const next =
              text === null
                ? shortlist.filter((x) => x !== index)
                : shortlist.includes(index)
                  ? shortlist
                  : [...shortlist, index];
            await actions.setModelContext!(contextFor(next));
            setShortlist(next);
          },
        }
      : actions;
    return (
      <section className="pgr-expanded" aria-label={`Profile of ${g.people[index].name}`}>
        <Button onClick={() => setOpen(null)}>← Back to all</Button>
        <ProfileCardView data={g.people[index]} actions={cardActions} />
      </section>
    );
  }

  return (
    <section className="ink-card pgr" aria-label={g.title ?? "People"}>
      {(g.title || g.caption) && (
        <header className="pgr-head">
          {g.title && <h2 className="pgr-title">{g.title}</h2>}
          {g.caption && <p className="pgr-caption ink-muted">{g.caption}</p>}
        </header>
      )}

      <ul className="pgr-grid">
        {g.people.map((p, i) => {
          const bits = [p.company, p.location].filter(Boolean) as string[];
          if (bits.length === 0 && p.highlights?.length) bits.push(p.highlights[0]);
          const on = selected.includes(i);
          return (
            <li key={i} className={`pgr-card${on ? " pgr-picked" : ""}`}>
              <button type="button" className="pgr-open" onClick={() => setOpen(i)} aria-label={`Open profile of ${p.name}`}>
                <Avatar src={p.avatarUrl} name={p.name} size={44} />
                <span className="pgr-who">
                  <span className="pgr-name">{p.name}</span>
                  {p.headline && <span className="pgr-headline">{p.headline}</span>}
                  {bits.length > 0 && <span className="pgr-meta">{bits.join(" · ")}</span>}
                </span>
              </button>
              <label className="pgr-pick">
                <input type="checkbox" checked={on} onChange={() => toggle(i)} aria-label={`Select ${p.name}`} />
              </label>
            </li>
          );
        })}
      </ul>

      <div className="ink-actions">
        <Button disabled={selected.length === 0 || busy !== null} onClick={ask}>
          {busy === "ask" ? "Asking…" : `Ask about selected${selected.length ? ` (${selected.length})` : ""}`}
        </Button>
        {actions.setModelContext && (
          <Button disabled={selected.length === 0 || busy !== null} onClick={addToShortlist}>
            {busy === "shortlist" ? "Adding…" : `Add to shortlist${selected.length ? ` (${selected.length})` : ""}`}
          </Button>
        )}
      </div>

      {actions.setModelContext && shortlist.length > 0 && (
        <div className="pgr-shortlist" aria-label="Shortlist">
          <p className="pgr-shortlist-label">Shortlist</p>
          <ul>
            {shortlist.map((i) => (
              <li key={i}>
                <span>{g.people[i].name}</span>
                <button
                  type="button"
                  className="pgr-remove"
                  aria-label={`Remove ${g.people[i].name} from shortlist`}
                  disabled={busy !== null}
                  onClick={() => removeFromShortlist(i)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Provenance source={g.source} open={actions.openLink} locale={actions.locale} />
    </section>
  );
}

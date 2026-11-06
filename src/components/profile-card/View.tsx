import { useState } from "react";
import type { ViewProps } from "../types.js";
import type { ProfileCard } from "./schema.js";
import { Avatar, Button, Chip, HostLink, Source, useBusy } from "../../runtime/primitives.js";
import "./profile-card.css";

export function accepts(d: unknown): d is ProfileCard {
  return !!d && typeof d === "object" && typeof (d as ProfileCard).name === "string";
}

export function View({ data: p, actions }: ViewProps<ProfileCard>) {
  const { busy, run } = useBusy();
  const [shortlisted, setShortlisted] = useState(false);
  const firstName = p.name.split(/\s+/)[0];
  const meta = [p.company, p.location].filter(Boolean) as string[];

  return (
    <article className="ink-card pc" aria-label={`Profile of ${p.name}`}>
      <header className="pc-head">
        <Avatar src={p.avatarUrl} name={p.name} />
        <div className="pc-who">
          <h2 className="pc-name">{p.name}</h2>
          {p.headline && <p className="pc-headline">{p.headline}</p>}
          {meta.length > 0 && (
            <p className="pc-meta">
              {meta.map((m) => (
                <span key={m}>{m}</span>
              ))}
            </p>
          )}
        </div>
      </header>

      {p.about && <p className="pc-about">{p.about}</p>}

      {p.highlights && p.highlights.length > 0 && (
        <ul className="pc-highlights">
          {p.highlights.map((h, i) => (
            <li key={i}>{h}</li>
          ))}
        </ul>
      )}

      {p.tags && p.tags.length > 0 && (
        <div className="ink-chips">
          {p.tags.map((t) => (
            <Chip key={t}>{t}</Chip>
          ))}
        </div>
      )}

      {p.links && p.links.length > 0 && (
        <nav className="pc-links" aria-label="Links">
          {p.links.map((l) => (
            <HostLink key={l.url} href={l.url} open={actions.openLink}>
              {l.label}
            </HostLink>
          ))}
        </nav>
      )}

      <div className="ink-actions">
        {p.profileUrl && (
          <Button primary onClick={() => actions.openLink(p.profileUrl!)}>
            Open profile
          </Button>
        )}
        <Button
          disabled={busy !== null}
          onClick={() =>
            run("outreach", () =>
              actions.sendMessage(
                `Draft a short, friendly outreach message to ${p.name}${p.headline ? ` (${p.headline})` : ""}. Reference something specific from their profile.`,
              ),
            )
          }
        >
          {busy === "outreach" ? "Asking…" : "Draft outreach"}
        </Button>
        <Button
          disabled={busy !== null}
          onClick={() =>
            run("more", () =>
              actions.sendMessage(
                `Tell me more about ${p.name}: recent work, and anything notable I should know before contacting ${firstName}.`,
              ),
            )
          }
        >
          {busy === "more" ? "Asking…" : "Dig deeper"}
        </Button>
        {actions.setModelContext && (
          <Button
            pressed={shortlisted}
            disabled={busy !== null}
            onClick={() =>
              run("shortlist", async () => {
                const next = !shortlisted;
                await actions.setModelContext!(
                  next
                    ? `The user added ${p.name}${p.headline ? ` (${p.headline})` : ""}${p.profileUrl ? `, ${p.profileUrl}` : ""} to their shortlist.`
                    : null,
                );
                setShortlisted(next);
              })
            }
          >
            {shortlisted ? "Shortlisted ✓" : "Add to shortlist"}
          </Button>
        )}
      </div>

      <Source source={p.source} open={actions.openLink} />
    </article>
  );
}

/**
 * Inkview profile card view. Talks to the host through the official MCP Apps
 * bridge (@modelcontextprotocol/ext-apps), which Claude and ChatGPT both speak.
 */
import type { App } from "@modelcontextprotocol/ext-apps";
import { useApp, useHostStyles } from "@modelcontextprotocol/ext-apps/react";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { initials, ProfileCardSchema, type ProfileCard } from "../schemas/profile-card";
import "./theme.css";
import "./profile-card.css";

/** Pull the profile out of a tool result, or out of the raw tool input. */
function readProfile(value: unknown): ProfileCard | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const candidate =
    (v.structuredContent as Record<string, unknown> | undefined)?.profile ?? v.profile ?? v.arguments ?? v;
  const parsed = ProfileCardSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

function Avatar({ profile }: { profile: ProfileCard }) {
  const [failed, setFailed] = useState(false);
  if (profile.avatarUrl && !failed) {
    return (
      <img
        className="avatar"
        src={profile.avatarUrl}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div className="avatar" aria-hidden="true">
      {initials(profile.name)}
    </div>
  );
}

function Card({ app, profile }: { app: App; profile: ProfileCard }) {
  const [busy, setBusy] = useState<string | null>(null);
  const firstName = profile.name.split(/\s+/)[0];
  const meta = [profile.company, profile.location].filter(Boolean) as string[];

  const open = (url: string) => {
    app.openLink({ url }).catch(() => window.open(url, "_blank", "noopener"));
  };
  const ask = async (key: string, text: string) => {
    setBusy(key);
    try {
      await app.sendMessage({ role: "user", content: [{ type: "text", text }] });
    } finally {
      setBusy(null);
    }
  };

  return (
    <article className="card" aria-label={`Profile of ${profile.name}`}>
      <header className="head">
        <Avatar profile={profile} />
        <div className="who">
          <h2 className="name">{profile.name}</h2>
          {profile.headline && <p className="headline">{profile.headline}</p>}
          {meta.length > 0 && (
            <p className="meta">
              {meta.map((m) => (
                <span key={m}>{m}</span>
              ))}
            </p>
          )}
        </div>
      </header>

      {profile.about && <p className="about">{profile.about}</p>}

      {profile.highlights && profile.highlights.length > 0 && (
        <ul className="highlights">
          {profile.highlights.map((h, i) => (
            <li key={i}>{h}</li>
          ))}
        </ul>
      )}

      {profile.tags && profile.tags.length > 0 && (
        <div className="tags">
          {profile.tags.map((t) => (
            <span className="tag" key={t}>
              {t}
            </span>
          ))}
        </div>
      )}

      {profile.links && profile.links.length > 0 && (
        <nav className="links" aria-label="Links">
          {profile.links.map((l) => (
            <button className="link" key={l.url} onClick={() => open(l.url)}>
              {l.label}
            </button>
          ))}
        </nav>
      )}

      <div className="actions">
        {profile.profileUrl && (
          <button className="btn primary" onClick={() => open(profile.profileUrl!)}>
            Open profile
          </button>
        )}
        <button
          className="btn"
          disabled={busy !== null}
          onClick={() =>
            ask(
              "outreach",
              `Draft a short, friendly outreach message to ${profile.name}${profile.headline ? ` (${profile.headline})` : ""}. Reference something specific from their profile.`,
            )
          }
        >
          {busy === "outreach" ? "Asking…" : "Draft outreach"}
        </button>
        <button
          className="btn"
          disabled={busy !== null}
          onClick={() => ask("more", `Tell me more about ${profile.name}: recent work, and anything notable I should know before contacting ${firstName}.`)}
        >
          {busy === "more" ? "Asking…" : "Dig deeper"}
        </button>
      </div>

      {profile.source && (
        <p className="source">
          Source:{" "}
          {profile.source.url ? (
            <button className="link" onClick={() => open(profile.source!.url!)}>
              {profile.source.name}
            </button>
          ) : (
            profile.source.name
          )}
        </p>
      )}
    </article>
  );
}

function ProfileCardApp() {
  const [profile, setProfile] = useState<ProfileCard | null>(null);
  const [cancelled, setCancelled] = useState(false);

  const { app, error } = useApp({
    appInfo: { name: "Inkview profile card", version: "0.1.0" },
    capabilities: {},
    onAppCreated: (app) => {
      // Render from the arguments as soon as they arrive, then from the
      // validated result.
      app.ontoolinput = (params) => {
        const p = readProfile(params);
        if (p) setProfile((prev) => prev ?? p);
      };
      app.ontoolresult = (result) => {
        const p = readProfile(result);
        if (p) setProfile(p);
      };
      app.ontoolcancelled = () => setCancelled(true);
      app.onerror = (e) => console.error("[inkview]", e);
    },
  });
  useHostStyles(app, app?.getHostContext());

  if (error) return <p className="state">Inkview could not connect to the host: {error.message}</p>;
  if (cancelled && !profile) return <p className="state">Cancelled.</p>;
  if (!app || !profile) {
    return (
      <div className="card" aria-busy="true">
        <div className="skeleton" style={{ width: "40%" }} />
        <div className="skeleton" style={{ width: "70%" }} />
        <div className="skeleton" style={{ width: "55%" }} />
      </div>
    );
  }
  return <Card app={app} profile={profile} />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ProfileCardApp />
  </StrictMode>,
);

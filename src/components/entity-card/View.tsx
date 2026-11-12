import type { ViewProps } from "../types.js";
import type { EntityCard } from "./schema.js";
import { Avatar, Button, HostLink, Provenance, Unchecked, useBusy } from "../../runtime/primitives.js";
import { isUnverified } from "../../runtime/provenance.js";
import { Actions } from "../../runtime/actions.js";
import "./entity-card.css";

export function accepts(d: unknown): d is EntityCard {
  return !!d && typeof d === "object" && typeof (d as EntityCard).name === "string";
}

const KIND_LABEL = { company: "Company", organization: "Organization", place: "Place", other: "" } as const;

export function View({ data: e, actions }: ViewProps<EntityCard>) {
  const { busy, run } = useBusy();
  const kind = e.kind ? KIND_LABEL[e.kind] : "";
  return (
    <article className="ink-card ec" aria-label={e.name}>
      <header className="ec-head">
        <Avatar src={e.logoUrl} name={e.name} shape="square" size={56} />
        <div className="ec-who">
          {kind && <p className="ec-kind">{kind}</p>}
          <h2 className="ec-name">{e.name}</h2>
          {e.tagline && <p className="ec-tagline">{e.tagline}</p>}
        </div>
      </header>
      {e.description && <p className="ec-desc">{e.description}</p>}
      {e.facts && e.facts.length > 0 && (
        <dl className="ec-facts">
          {e.facts.map((f) => (
            <div key={f.label} className="ec-fact">
              <dt>{f.label}</dt>
              <dd>
                {f.value}
                <Unchecked on={isUnverified(e, f.label)} />
              </dd>
            </div>
          ))}
        </dl>
      )}
      {e.links && e.links.length > 0 && (
        <nav className="ec-links" aria-label="Links">
          {e.links.map((l) => (
            <HostLink key={l.url} href={l.url} open={actions.openLink}>
              {l.label}
            </HostLink>
          ))}
        </nav>
      )}
      {(e.phone || e.address) && (
        <p className="ec-contact">
          {e.phone && <span>{e.phone}</span>}
          <Unchecked on={isUnverified(e, "phone")} />
          {e.phone && e.address && " · "}
          {e.address && <span>{e.address}</span>}
          <Unchecked on={isUnverified(e, "address")} />
        </p>
      )}
      <div className="ink-actions">
        <Actions item={{ title: e.name, url: e.websiteUrl, phone: e.phone, address: e.address }} actions={actions} openLabel="Open website" copy={["phone", "address"]} />
        <Button
          disabled={busy !== null}
          onClick={() =>
            run("compare", () =>
              actions.sendMessage(`Compare ${e.name} with its main alternatives. Show the comparison with show_comparison.`),
            )
          }
        >
          {busy === "compare" ? "Asking…" : "Compare"}
        </Button>
      </div>
      <Provenance source={e.source} items={[e]} sensitive open={actions.openLink} locale={actions.locale} />
    </article>
  );
}

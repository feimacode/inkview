import { useEffect, useRef, useState } from "react";
import type { ViewProps } from "../types.js";
import type { DocumentDraft } from "./schema.js";
import { KIND_LABEL, approveAction, metaEntries } from "./format.js";
import { Markdown } from "./markdown-view.js";
import { Button, useBusy } from "../../runtime/primitives.js";
import "./document-preview.css";

export function accepts(d: unknown): d is DocumentDraft {
  const doc = d as DocumentDraft;
  return !!doc && typeof doc === "object" && typeof doc.body === "string";
}

const clipboardAvailable = () => typeof navigator !== "undefined" && typeof navigator.clipboard?.writeText === "function";

export function View({ data, actions }: ViewProps<DocumentDraft>) {
  const kindLabel = KIND_LABEL[data.kind ?? "other"] ?? KIND_LABEL.other;
  const entries = metaEntries(data.kind, data.meta);
  const [body, setBody] = useState(data.body);
  const [editing, setEditing] = useState(false);
  const [canCopy, setCanCopy] = useState(clipboardAvailable);
  const [copied, setCopied] = useState(false);
  const { busy, run } = useBusy();
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const chars = [...body].length;
  const words = body.trim() ? body.trim().split(/\s+/).length : 0;
  const over = data.limit !== undefined && chars > data.limit;

  useEffect(() => {
    if (editing) editorRef.current?.focus();
  }, [editing]);

  const copy = () => {
    void navigator.clipboard.writeText(body).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      },
      () => setCanCopy(false),
    );
  };

  const approve = () =>
    run("approve", () => {
      const parts = [`Approved: ${approveAction(data.kind)}`];
      if (data.title) parts.push(data.title);
      parts.push(body);
      return actions.sendMessage(parts.join("\n\n"));
    });

  return (
    <article className="ink-card dp" aria-label={data.title ?? `${kindLabel} draft`}>
      <header className="dp-head">
        <p className="dp-kind">{kindLabel}</p>
        {data.title && <h2 className="ink-title dp-title">{data.title}</h2>}
        {entries.length > 0 && (
          <dl className="dp-meta">
            {entries.map(([label, value]) => (
              <div key={label} className="dp-meta-row">
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </header>

      {editing ? (
        <div className="dp-editor">
          <textarea
            ref={editorRef}
            aria-label="Draft body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            spellCheck
          />
        </div>
      ) : (
        <div className="dp-body">
          <Markdown text={body} openLink={actions.openLink} />
        </div>
      )}

      <p className="dp-count">
        <span className={over ? "dp-count-over" : undefined}>
          {chars} {chars === 1 ? "character" : "characters"}
        </span>
        <span>{words} {words === 1 ? "word" : "words"}</span>
        {data.limit !== undefined &&
          (over ? (
            <span className="dp-count-over">{chars - data.limit} over the limit</span>
          ) : (
            <span>{data.limit - chars} characters left</span>
          ))}
      </p>

      <div className="ink-actions dp-actions">
        <Button onClick={() => setEditing(!editing)}>{editing ? "Done" : "Edit"}</Button>
        {canCopy && <Button onClick={copy}>{copied ? "Copied" : "Copy"}</Button>}
        <Button primary disabled={busy !== null} onClick={approve}>
          {busy === "approve" ? "Sending…" : "Approve"}
        </Button>
      </div>
    </article>
  );
}

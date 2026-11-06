import { useEffect, useMemo, useRef, useState } from "react";
import type { ViewProps } from "../types.js";
import type { TaskItem, TaskList } from "./schema.js";
import { formatDueDate, isOverdue, todayIso } from "./date.js";
import { Button, HostLink, Source, useBusy } from "../../runtime/primitives.js";
import "./task-list.css";

const DEFAULT_STATUSES = ["To do", "In progress", "Done"];

const priorityLabel: Record<string, string> = { high: "High priority", medium: "Medium priority", low: "Low priority" };

export function accepts(d: unknown): d is TaskList {
  const list = d as TaskList;
  return (
    !!list &&
    typeof list === "object" &&
    Array.isArray(list.items) &&
    list.items.every((item) => item && typeof item.title === "string" && typeof item.status === "string")
  );
}

export function View({ data, actions }: ViewProps<TaskList>) {
  const statuses = useMemo(() => {
    const base = data.statuses && data.statuses.length >= 2 ? [...data.statuses] : [...DEFAULT_STATUSES];
    for (const item of data.items) if (!base.includes(item.status)) base.push(item.status);
    return base;
  }, [data.statuses, data.items]);
  const lastStatus = statuses[statuses.length - 1];
  const [items, setItems] = useState<TaskItem[]>(() => data.items.map((item) => ({ ...item })));
  const [mode, setMode] = useState<"checklist" | "board">("checklist");
  const { busy, run } = useBusy();
  const rootRef = useRef<HTMLElement>(null);
  const focusAfter = useRef<{ index: number; control: "select" | "checkbox" } | null>(null);
  const today = todayIso();
  const changedIndexes = useMemo(
    () => items.flatMap((item, index) => (item.status !== data.items[index].status ? [index] : [])),
    [items, data.items],
  );
  const doneCount = items.filter((item) => item.status === lastStatus).length;

  const lines = (list: TaskItem[], indexes: number[]) => indexes.map((index) => `- ${list[index].title}: ${list[index].status}`).join("\n");

  useEffect(() => {
    const target = focusAfter.current;
    if (!target) return;
    focusAfter.current = null;
    const selector = target.control === "select" ? "select" : "input.tk-check";
    rootRef.current?.querySelector<HTMLElement>(`${selector}[data-task-index="${target.index}"]`)?.focus();
  }, [items]);

  const move = (index: number, status: string, control: "select" | "checkbox") => {
    if (items[index].status === status) return;
    focusAfter.current = { index, control };
    const next = items.map((item, i) => (i === index ? { ...item, status } : item));
    setItems(next);
    const changed = next.flatMap((item, i) => (item.status !== data.items[i].status ? [i] : []));
    if (actions.setModelContext && changed.length) {
      const list = data.title ? `The task list "${data.title}"` : "The task list";
      void actions.setModelContext(`${list} now shows these user changes:\n${lines(next, changed)}`);
    }
  };

  const toggleDone = (index: number) => move(index, items[index].status === lastStatus ? statuses[0] : lastStatus, "checkbox");

  const send = () =>
    run("send", () => {
      const list = data.title ? `I updated the task list "${data.title}":` : "I updated the task list:";
      return actions.sendMessage(`${list}\n${lines(items, changedIndexes)}`);
    });

  const renderItem = (item: TaskItem, index: number) => {
    const done = item.status === lastStatus;
    const late = item.due ? isOverdue(item.due, item.status, lastStatus, today) : false;
    return (
      <li key={index} className={`tk-item${done ? " tk-item--done" : ""}`}>
        <div className="tk-item-main">
          <input
            type="checkbox"
            className="tk-check"
            checked={done}
            disabled={busy !== null}
            onChange={() => toggleDone(index)}
            aria-label={`Mark "${item.title}" as done`}
            data-task-index={index}
          />
          <div className="tk-item-body">
            <div className="tk-item-title">
              {item.url ? (
                <HostLink href={item.url} open={actions.openLink}>
                  {item.title}
                </HostLink>
              ) : (
                item.title
              )}
            </div>
            {(item.owner || item.due || item.priority || item.labels?.length) && (
              <div className="tk-item-meta">
                {item.owner && <span className="tk-owner">{item.owner}</span>}
                {item.due && (
                  <span className={`tk-due${late ? " tk-due--late" : ""}`}>
                    {late && <span className="tk-badge tk-badge--late">Overdue</span>}
                    <time dateTime={item.due}>{formatDueDate(item.due, actions.locale)}</time>
                  </span>
                )}
                {item.priority && <span className={`tk-badge tk-priority tk-priority--${item.priority}`}>{priorityLabel[item.priority]}</span>}
                {item.labels?.map((label) => (
                  <span key={label} className="tk-label">
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>
          <label className="tk-status">
            <span className="ink-sr">{`Status of "${item.title}"`}</span>
            <select value={item.status} disabled={busy !== null} data-task-index={index} onChange={(event) => move(index, event.target.value, "select")}>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>
      </li>
    );
  };

  const groups = statuses.map((status) => ({
    status,
    entries: items.flatMap((item, index) => (item.status === status ? [{ item, index }] : [])),
  }));

  return (
    <article ref={rootRef} className="ink-card tk" aria-label={data.title ?? "Tasks"}>
      <div className="tk-head">
        <div>
          {data.title && <h2 className="ink-title">{data.title}</h2>}
          <p className="tk-summary ink-muted">
            {items.length} {items.length === 1 ? "task" : "tasks"} · {doneCount} done
          </p>
        </div>
        <div className="tk-modes" role="group" aria-label="Layout">
          <Button pressed={mode === "checklist"} onClick={() => setMode("checklist")}>
            Checklist
          </Button>
          <Button pressed={mode === "board"} onClick={() => setMode("board")}>
            Board
          </Button>
        </div>
      </div>

      {mode === "checklist" ? (
        <div className="tk-list">
          {groups.map(({ status, entries }) => (
            <section key={status} className="tk-group" aria-label={status}>
              <h3 className="tk-group-title">
                {status} <span className="tk-count">{entries.length}</span>
              </h3>
              {entries.length ? (
                <ul className="tk-items">{entries.map(({ item, index }) => renderItem(item, index))}</ul>
              ) : (
                <p className="tk-empty">Nothing here.</p>
              )}
            </section>
          ))}
        </div>
      ) : (
        <div className="tk-board-wrap">
          <div className="tk-board">
            {groups.map(({ status, entries }) => (
              <section key={status} className="tk-col" aria-label={status}>
                <h3 className="tk-col-title">
                  {status} <span className="tk-count">{entries.length}</span>
                </h3>
                {entries.length ? (
                  <ul className="tk-items">{entries.map(({ item, index }) => renderItem(item, index))}</ul>
                ) : (
                  <p className="tk-empty">Nothing here.</p>
                )}
              </section>
            ))}
          </div>
        </div>
      )}

      <div className="ink-actions">
        <Button primary disabled={changedIndexes.length === 0 || busy !== null} onClick={send}>
          {busy === "send" ? "Sending…" : `Send changes${changedIndexes.length ? ` (${changedIndexes.length})` : ""}`}
        </Button>
      </div>

      <Source source={data.source} open={actions.openLink} />
    </article>
  );
}

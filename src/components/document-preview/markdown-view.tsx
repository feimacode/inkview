import { useMemo, type ReactNode } from "react";
import { HostLink } from "../../runtime/primitives.js";

/** The safe markdown subset a document body may use. Raw HTML is always text. */

type Inline =
  | { type: "text"; value: string }
  | { type: "code"; value: string }
  | { type: "strong"; children: Inline[] }
  | { type: "em"; children: Inline[] }
  | { type: "link"; href: string; children: Inline[] }
  | { type: "image"; alt: string; src: string };

type Block =
  | { type: "heading"; level: number; children: Inline[] }
  | { type: "paragraph"; children: Inline[] }
  | { type: "code"; lang: string; value: string }
  | { type: "blockquote"; children: Block[] }
  | { type: "list"; ordered: boolean; start: number; items: Block[][] }
  | { type: "table"; header: Inline[][]; rows: Inline[][][] }
  | { type: "hr" };

const ESCAPABLE = "\\`*_{}[]()#+-.!|>~";

function safeHref(href: string): string | null {
  try {
    const { protocol } = new URL(href);
    return protocol === "http:" || protocol === "https:" || protocol === "mailto:" ? href : null;
  } catch {
    return null;
  }
}

function matchLink(text: string, start: number): { label: string; href: string; end: number } | null {
  if (text[start] !== "[") return null;
  const close = text.indexOf("]", start + 1);
  if (close === -1 || text[close + 1] !== "(") return null;
  let depth = 0;
  let end = -1;
  for (let i = close + 2; i < text.length; i++) {
    if (text[i] === "(") depth++;
    else if (text[i] === ")") {
      if (depth === 0) {
        end = i;
        break;
      }
      depth--;
    }
  }
  if (end === -1) return null;
  const href = text.slice(close + 2, end).trim();
  if (!href || /\s/.test(href)) return null;
  return { label: text.slice(start + 1, close), href, end: end + 1 };
}

function findEmEnd(text: string, from: number, mark: string): number {
  for (let i = from; i < text.length; i++) {
    if (text[i] !== mark || text[i - 1] === " " || text[i + 1] === mark) continue;
    const next = text[i + 1];
    if (!next || !/\w/.test(next)) return i;
  }
  return -1;
}

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  let plain = "";
  const flush = () => {
    if (plain) out.push({ type: "text", value: plain });
    plain = "";
  };
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === "\\" && i + 1 < text.length && ESCAPABLE.includes(text[i + 1])) {
      plain += text[i + 1];
      i += 2;
      continue;
    }
    if (ch === "`") {
      let end = i + 1;
      while (end < text.length && text[end] !== "`") end++;
      if (end < text.length) {
        flush();
        out.push({ type: "code", value: text.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }
    if (ch === "!" && text[i + 1] === "[") {
      const link = matchLink(text, i + 1);
      if (link) {
        flush();
        out.push({ type: "image", alt: link.label, src: link.href });
        i = link.end;
        continue;
      }
    }
    if (ch === "[") {
      const link = matchLink(text, i);
      if (link) {
        flush();
        out.push({ type: "link", href: link.href, children: parseInline(link.label) });
        i = link.end;
        continue;
      }
    }
    if (text.startsWith("**", i) || text.startsWith("__", i)) {
      const mark = text.slice(i, i + 2);
      const end = text.indexOf(mark, i + 2);
      if (end > i + 2) {
        flush();
        out.push({ type: "strong", children: parseInline(text.slice(i + 2, end)) });
        i = end + 2;
        continue;
      }
    }
    if (ch === "*" || ch === "_") {
      const prev = text[i - 1];
      if (text[i + 1] !== " " && (ch !== "_" || !prev || !/\w/.test(prev))) {
        const end = findEmEnd(text, i + 1, ch);
        if (end !== -1) {
          flush();
          out.push({ type: "em", children: parseInline(text.slice(i + 1, end)) });
          i = end + 1;
          continue;
        }
      }
    }
    plain += ch;
    i++;
  }
  flush();
  return out;
}

const FENCE = /^\s*(`{3,}|~{3,})\s*([\w-]*)\s*$/;
const HEADING = /^(#{1,6})\s+(.*?)\s*$/;
const THEMATIC = /^\s*(?:(?:\*\s*){3,}|(?:-\s*){3,}|(?:_\s*){3,})$/;
const BULLET = /^(\s*)([-*+])\s+(.*)$/;
const ORDERED = /^(\s*)(\d{1,9})[.)]\s+(.*)$/;

function indentOf(line: string): number {
  return line.match(/^\s*/)![0].length;
}

function splitRow(line: string): string[] {
  let body = line.trim();
  if (body.startsWith("|")) body = body.slice(1);
  if (body.endsWith("|")) body = body.slice(0, -1);
  const cells: string[] = [];
  let current = "";
  for (let i = 0; i < body.length; i++) {
    if (body[i] === "\\" && body[i + 1] === "|") {
      current += "|";
      i++;
    } else if (body[i] === "|") {
      cells.push(current.trim());
      current = "";
    } else {
      current += body[i];
    }
  }
  cells.push(current.trim());
  return cells;
}

function isTableStart(lines: string[], i: number): boolean {
  if (i + 1 >= lines.length || !lines[i].includes("|")) return false;
  const separator = splitRow(lines[i + 1]);
  return separator.length > 0 && separator.every((cell) => /^:?-+:?$/.test(cell));
}

function startsBlock(lines: string[], i: number): boolean {
  const line = lines[i];
  return FENCE.test(line) || HEADING.test(line) || THEMATIC.test(line) || /^\s*>/.test(line) || BULLET.test(line) || ORDERED.test(line) || isTableStart(lines, i);
}

export function parseBlocks(lines: string[]): Block[] {
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }

    const fence = line.match(FENCE);
    if (fence) {
      const mark = fence[1][0];
      const length = fence[1].length;
      const body: string[] = [];
      i++;
      while (i < lines.length) {
        const close = lines[i].match(/^\s*(`{3,}|~{3,})\s*$/);
        if (close && close[1][0] === mark && close[1].length >= length) {
          i++;
          break;
        }
        body.push(lines[i]);
        i++;
      }
      blocks.push({ type: "code", lang: fence[2], value: body.join("\n") });
      continue;
    }

    const heading = line.match(HEADING);
    if (heading) {
      blocks.push({ type: "heading", level: heading[1].length, children: parseInline(heading[2]) });
      i++;
      continue;
    }

    if (THEMATIC.test(line)) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    if (/^\s*>/.test(line)) {
      const quoted: string[] = [];
      while (i < lines.length) {
        const match = lines[i].match(/^\s*>\s?(.*)$/);
        if (match) {
          quoted.push(match[1]);
          i++;
        } else if (!lines[i].trim() && i + 1 < lines.length && /^\s*>/.test(lines[i + 1])) {
          quoted.push("");
          i++;
        } else {
          break;
        }
      }
      blocks.push({ type: "blockquote", children: parseBlocks(quoted) });
      continue;
    }

    if (isTableStart(lines, i)) {
      const header = splitRow(line).map(parseInline);
      const rows: Inline[][][] = [];
      i += 2;
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
        const cells = splitRow(lines[i]);
        rows.push(header.map((_, index) => parseInline(cells[index] ?? "")));
        i++;
      }
      blocks.push({ type: "table", header, rows });
      continue;
    }

    const bullet = line.match(BULLET);
    const ordered = bullet ? null : line.match(ORDERED);
    if (bullet || ordered) {
      const orderedList = !!ordered;
      const base = indentOf(line);
      const start = ordered ? Number(ordered[2]) : 1;
      const items: Block[][] = [];
      while (i < lines.length) {
        const item = orderedList ? lines[i].match(ORDERED) : lines[i].match(BULLET);
        if (!item || indentOf(lines[i]) !== base) break;
        const content: string[] = [item[3]];
        i++;
        while (i < lines.length) {
          const next = lines[i];
          if (!next.trim()) {
            let j = i + 1;
            while (j < lines.length && !lines[j].trim()) j++;
            if (j < lines.length && indentOf(lines[j]) > base) {
              content.push("");
              i++;
              continue;
            }
            i = j;
            break;
          }
          if (indentOf(next) <= base) break;
          content.push(next.slice(Math.min(indentOf(next), base + 2)));
          i++;
        }
        items.push(parseBlocks(content));
      }
      blocks.push({ type: "list", ordered: orderedList, start, items });
      continue;
    }

    const paragraph: string[] = [line.trim()];
    i++;
    while (i < lines.length && lines[i].trim() && !startsBlock(lines, i)) {
      paragraph.push(lines[i].trim());
      i++;
    }
    blocks.push({ type: "paragraph", children: parseInline(paragraph.join(" ")) });
  }
  return blocks;
}

function renderInline(inlines: Inline[], openLink: (href: string) => void, keyPrefix = ""): ReactNode[] {
  return inlines.map((inline, index) => {
    const key = `${keyPrefix}${index}`;
    switch (inline.type) {
      case "text":
        return inline.value;
      case "code":
        return (
          <code key={key} className="dp-code">
            {inline.value}
          </code>
        );
      case "strong":
        return <strong key={key}>{renderInline(inline.children, openLink, `${key}.`)}</strong>;
      case "em":
        return <em key={key}>{renderInline(inline.children, openLink, `${key}.`)}</em>;
      case "link": {
        const href = safeHref(inline.href);
        const children = renderInline(inline.children, openLink, `${key}.`);
        return href ? (
          <HostLink key={key} href={href} open={openLink}>
            {children}
          </HostLink>
        ) : (
          children
        );
      }
      case "image": {
        const href = safeHref(inline.src);
        const label = inline.alt || "Image";
        return href ? (
          <HostLink key={key} href={href} open={openLink}>
            {label}
          </HostLink>
        ) : (
          label
        );
      }
    }
  });
}

function renderBlocks(blocks: Block[], openLink: (href: string) => void): ReactNode[] {
  return blocks.map((block, index) => {
    const key = `b${index}`;
    switch (block.type) {
      case "heading": {
        const Tag = `h${block.level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
        return (
          <Tag key={key} className={`dp-h dp-h${block.level}`}>
            {renderInline(block.children, openLink, `${key}.`)}
          </Tag>
        );
      }
      case "paragraph":
        return (
          <p key={key} className="dp-p">
            {renderInline(block.children, openLink, `${key}.`)}
          </p>
        );
      case "code":
        return (
          <pre key={key} className="dp-pre">
            <code>{block.value}</code>
          </pre>
        );
      case "blockquote":
        return (
          <blockquote key={key} className="dp-quote">
            {renderBlocks(block.children, openLink)}
          </blockquote>
        );
      case "list": {
        const items = block.items.map((item, itemIndex) => {
          const [first, ...rest] = item;
          const lead = first && first.type === "paragraph" ? renderInline(first.children, openLink, `${key}.${itemIndex}.`) : renderBlocks(first ? [first] : [], openLink);
          return (
            <li key={itemIndex}>
              {lead}
              {renderBlocks(rest, openLink)}
            </li>
          );
        });
        return block.ordered ? (
          <ol key={key} className="dp-list" start={block.start > 1 ? block.start : undefined}>
            {items}
          </ol>
        ) : (
          <ul key={key} className="dp-list">
            {items}
          </ul>
        );
      }
      case "table":
        return (
          <div key={key} className="dp-table-wrap">
            <table className="dp-table">
              <thead>
                <tr>
                  {block.header.map((cell, cellIndex) => (
                    <th key={cellIndex} scope="col">
                      {renderInline(cell, openLink, `${key}.h${cellIndex}.`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex}>{renderInline(cell, openLink, `${key}.${rowIndex}.${cellIndex}.`)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case "hr":
        return <hr key={key} className="dp-hr" />;
    }
  });
}

export function Markdown({ text, openLink }: { text: string; openLink: (href: string) => void }) {
  const blocks = useMemo(() => parseBlocks(text.replace(/\r\n?/g, "\n").split("\n")), [text]);
  return <>{renderBlocks(blocks, openLink)}</>;
}

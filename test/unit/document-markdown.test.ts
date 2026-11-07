import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Markdown } from "../../src/components/document-preview/markdown-view.js";

const render = (text: string) => renderToStaticMarkup(createElement(Markdown, { text, openLink: () => {} }));

test("document markdown renderer: headings, paragraphs, emphasis and code", () => {
  const html = render("# Title\n\nHello **bold** and *em* with `code` here.");
  assert.match(html, /<h1 class="dp-h dp-h1">Title<\/h1>/);
  assert.match(html, /<p class="dp-p">Hello <strong>bold<\/strong> and <em>em<\/em> with <code class="dp-code">code<\/code> here\.<\/p>/);
  assert.match(render("### Small"), /<h3 class="dp-h dp-h3">Small<\/h3>/);
  assert.match(render("## Not # a heading"), /<h2 class="dp-h dp-h2">Not # a heading<\/h2>/);
});

test("document markdown renderer: bullet and ordered lists, with and without a start value", () => {
  const unordered = render("- one\n- two\n  - nested");
  assert.match(unordered, /<ul class="dp-list"><li>one<\/li><li>two<ul class="dp-list"><li>nested<\/li><\/ul><\/li><\/ul>/);
  const ordered = render("3. three\n4. four");
  assert.match(ordered, /<ol class="dp-list" start="3"><li>three<\/li><li>four<\/li><\/ol>/);
  assert.match(render("1. one\n2. two"), /<ol class="dp-list"><li>one<\/li>/);
});

test("document markdown renderer: fenced code is text and escapes angle brackets", () => {
  const html = render("```ts\nif (a < b) return {x: 1};\n```");
  assert.match(html, /<pre class="dp-pre"><code>if \(a &lt; b\) return \{x: 1\};<\/code><\/pre>/);
  assert.doesNotMatch(html, /<span/);
});

test("document markdown renderer: links open through the host, unsafe links stay text", () => {
  assert.match(render("Read [the note](https://example.com/note)."), /<button type="button" class="ink-link">the note<\/button>/);
  const unsafe = render("[click](javascript:alert(1))");
  assert.match(unsafe, /^<p class="dp-p">click<\/p>$/);
  assert.doesNotMatch(unsafe, /javascript:/);
});

test("document markdown renderer: images show alt text instead of loading", () => {
  const html = render("![Architecture](https://example.com/diagram.png)");
  assert.match(html, /<button type="button" class="ink-link">Architecture<\/button>/);
  assert.doesNotMatch(html, /<img/);
  assert.match(render("![](https://example.com/x.png)"), />Image<\/button>/);
});

test("document markdown renderer: blockquotes, tables and rules", () => {
  const html = render("> Careful here.\n\n| Metric | Before |\n| --- | ---: |\n| Activation | 41% |\n\n---");
  assert.match(html, /<blockquote class="dp-quote"><p class="dp-p">Careful here\.<\/p><\/blockquote>/);
  assert.match(html, /<table class="dp-table"><thead><tr><th scope="col">Metric<\/th><th scope="col">Before<\/th><\/tr><\/thead><tbody><tr><td>Activation<\/td><td>41%<\/td><\/tr><\/tbody><\/table>/);
  assert.match(html, /<hr class="dp-hr"\/>$/);
});

test("document markdown renderer: raw HTML is literal text", () => {
  const html = render("<script>alert(1)</script> and <img src=x onerror=alert(1)>");
  assert.doesNotMatch(html, /<script/);
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt; and &lt;img src=x onerror=alert\(1\)&gt;/);
});

test("document markdown renderer: intra-word underscores stay literal", () => {
  const html = render("Run `snake_case` then _emphasized_ text.");
  assert.match(html, /snake_case/);
  assert.match(html, /<em>emphasized<\/em>/);
  assert.doesNotMatch(render("a snake_case_name b"), /<em>/);
});

test("document markdown renderer: escaped markup stays literal", () => {
  const html = render("\\*not emphasis\\* and \\`not code\\`");
  assert.match(html, /\*not emphasis\* and `not code`/);
  assert.doesNotMatch(html, /<em>|<code/);
});

test("document markdown renderer: CRLF input and empty input", () => {
  assert.match(render("one\r\n\r\ntwo"), /<p class="dp-p">one<\/p><p class="dp-p">two<\/p>/);
  assert.equal(render(""), "");
});

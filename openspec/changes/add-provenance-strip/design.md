# Design

## Context

Twelve component schemas declare their own `source` object (`{ name, url? }`), `person.ts` exports a `SourceSchema`, and every view prints it through the `Source` primitive in `src/runtime/primitives.tsx` as "Source: <name>". Listings also has a top-level `asOf` that drives the "Open now" freshness rule and a "checked <date>" note. `result-list` uses `source` as a plain publisher string per item. Inkview never fetches data (project rule), so all provenance is declared by the agent.

## Goals / Non-Goals

**Goals:**
- One provenance shape, one footer and one fallback line used by every component.
- Make missing sources and unchecked values visible without blocking the render.
- Stay additive: every call that is valid today stays valid.

**Non-Goals:**
- Verifying anything Inkview is told (no fetching, no link checks).
- Link risk levels, which come in a separate change built on this footer.
- Per-field timestamps. One `retrievedAt` per source is enough for a consumer to judge freshness.

## Decisions

1. **Extend `source`, don't add a new field.** `source` becomes `{ name, url?, retrievedAt? }` in a shared `src/components/provenance.ts` (`SourceSchema`, `withProvenance(itemSchema)` helper). The alternative, a new `provenance` object, would leave two ways to say the same thing.
2. **Listings `asOf` stays.** It keeps its meaning (when prices and opening state were looked up). The footer uses `asOf` as the check time when `source.retrievedAt` is absent. One rule for "most recent check time": max of `retrievedAt` values and `asOf`.
3. **`result-list` keeps `source` as a string.** Changing it would break existing calls. Its items get `sourceInfo` with the shared shape instead. This is the one naming exception, and the guidance spells it out.
4. **`unverified` is a list of field names on the item.** The alternative was wrapping values (`{ value, verified }`), but that breaks every existing schema and doubles payload size. Field names are matched against the item's own top-level keys. Nested fields (e.g. `price.amount`) are named by their top-level key (`price`).
5. **Marker design.** A small hollow ring after the value plus a dotted underline, `aria-label="not checked"`, and a `title` tooltip. No colour-only signal, so it meets the existing accessibility requirement. The footer adds "◦ = not checked against a source" only when a marker is shown.
6. **"Sensitive" components for the missing-source note and staleness note:** listings, product grid, comparison, entity card, itinerary, map. Others (chart, table, timeline, task list, profile card, profile grid, document preview, form) show the footer only when a source is given, to avoid noise on the user's own data.
7. **Relative time is computed at render** from the host's clock using `Intl.RelativeTimeFormat` with the host locale, so it stays correct in the markdown fallback (absolute date there, since text can be read later).

## Risks / Trade-offs

- [An agent can declare a fake source or skip `unverified`] → Inkview cannot detect that. The value of this change is that omissions become visible and honest agents have a standard way to be honest. The guidance and evals push agents to fill it.
- ["No source given" may feel noisy] → Shown only on the six sensitive components, in quiet text.
- [Models may overuse `unverified` and clutter cards] → Marker is small; footer explains it once.
- [Bundle growth] → Shared module and one primitive; expected well under 2 KB gzipped.

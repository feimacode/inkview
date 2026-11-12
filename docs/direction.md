# Direction

Adopted 2026-11-12. Background and the options considered:
[Inkview in the agent era](https://claude.ai/artifact/U8DRXjLeMFnBG3UqzaVvcC).

## The bet

AI agents are becoming a third way onto the internet, next to browsers and phone
apps. Big brands will ship their own MCP Apps. The long tail won't: the local
plumber, the small hotel, the gig at the corner pub. When an agent finds those, it
has nothing better than text to show them.

**Inkview is the rendering engine of the agent entrance.** It shows what the
agent found as real cards that say where the data came from and take you to the
business. In browser terms, it is the page renderer, the padlock and the link.

## Three jobs

| Job | What it means on every card | Browser equivalent |
| --- | --- | --- |
| Render | The data the agent already has, drawn as a native-looking component in any host | HTML and CSS |
| Trust | Where each value came from, when it was checked, and which values were not checked | The padlock and URL bar |
| Hand-off | A real next step at the business: open the site, call, directions, add to calendar | The hyperlink |

## What Inkview does not do

These hold however the product grows. A proposal that needs one of them needs a
new decision first.

- **No fetching or scraping.** Components only render data the agent passes in.
- **No checkout, booking or payments.** Actions link to the business. Payment
  standards belong to the platforms and payment networks.
- **No accounts or stored user data.** The hosted server stays stateless.
- **No paid data APIs.** Inkview is a renderer, not a data broker.
- **No gatekeeping.** Inkview shows risk and provenance and lets the user decide;
  it never hides a result because it disagrees with it.

## Checking a proposal against the direction

Every OpenSpec proposal answers, in its Why section, which job it serves:

1. Does it help the agent show something real (render)?
2. Does it help the user judge it (trust)?
3. Does it help the user act on it at the business (hand-off)?

A change that serves none of the three, or crosses a line above, is out of scope.

## Phases

1. **Trust and hand-off on what exists:** `add-provenance-strip`,
   `add-handoff-actions`, redeploy the hosted server, directory submissions.
2. **Discovery and real-chat checks:** tool descriptions written around everyday
   requests, and a manual test of 10 to 15 consumer prompts in Claude and ChatGPT.
3. **Memory without storage:** a shortlist kept in the chat, and a public host
   matrix.

Dropped after testing: reading schema.org JSON-LD from pages. On 19 Sydney pages
(12 Nov 2026) the agent's page fetch passed on none of it.

## Measuring it

The hosted server stores nothing, so success is measured outside it: directory
installs, npm downloads, GitHub stars, and the host matrix.

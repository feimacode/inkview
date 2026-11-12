# Inkview hosted server: privacy

_Last updated: 2026-11-06. This page will be published at a stable URL with the hosted server._

Inkview draws data your AI assistant already has as components in the chat.
The hosted server at `https://<hosted domain>/mcp` is free and needs no account.

## What the server receives

When your assistant calls an Inkview tool, the server receives the data for
that one component (for example a person's name and headline, or table rows),
checks it, and sends back the same data plus a text version. It also serves the
component's HTML.

## What it keeps

Nothing from your conversations. The server:

- does not store tool arguments or results, in a database, file, cache or anywhere else;
- does not write them to logs, traces or error reports. Logs hold only the request
  method, the tool name, the HTTP status, timing and the time of day;
- keeps each client IP in memory for at most one minute, only to rate-limit abuse;
- never fetches URLs from your data. Images such as avatars are loaded by your
  chat app directly from their source, and only from domains listed in the component's
  content security policy.

There are no cookies, analytics or third-party trackers in the server or the components.

## Map tiles

Maps, and the map views of listings and itineraries, load raster tiles directly from the configured tile provider (by default
OpenStreetMap). Each request contains only the tile coordinates for the area on
screen, but the provider still sees which part of the map you are looking at and
your IP address, under its own privacy policy. The Inkview server never proxies
or sees these requests. Tiles can be turned off with `INKVIEW_MAP_TILES=off`,
which leaves a neutral grid and the place list. On a self-hosted deployment,
point `INKVIEW_MAP_TILES` at your own tile server to keep map requests on your
infrastructure. Listings request no tiles until you switch to their map view.
Inkview never turns an address into coordinates: a place without coordinates is
listed, not looked up.

## Self-hosting

Inkview is open source (MIT). To keep everything on your own machine, run it
locally with `npx -y @feimacode/inkview`, or deploy your own copy with the
Dockerfile. See the [README](../README.md) and [self-hosting](self-hosting.md).

## Contact

Open an issue at https://github.com/feimacode/inkview/issues.

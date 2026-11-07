/**
 * Resource metadata shared by the render server and its unit tests. Kept out of
 * server.ts so tests do not need the inlined UI bundle.
 */
import { tileDomains } from "../../../src/components/map/config.js";

/**
 * Image hosts components may load avatars and logos from. Hosts block any
 * image domain not declared in the resource CSP, so unknown domains fall back
 * to initials. Extend with INKVIEW_IMAGE_DOMAINS (comma separated origins).
 */
const DEFAULT_IMAGE_DOMAINS = [
  "https://avatars.githubusercontent.com",
  "https://media.licdn.com",
  "https://*.gravatar.com",
  "https://unavatar.io",
  "https://upload.wikimedia.org",
  "https://images.unsplash.com",
  "https://pbs.twimg.com",
  "https://i.pravatar.cc",
  "https://logo.clearbit.com",
  "https://www.google.com",
  "https://*.gstatic.com",
  "https://icons.duckduckgo.com",
  "https://m.media-amazon.com",
  "https://i.ebayimg.com",
  "https://cdn.shopify.com",
];

export function imageDomains(env: NodeJS.ProcessEnv = process.env): string[] {
  const extra = (env.INKVIEW_IMAGE_DOMAINS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return [...DEFAULT_IMAGE_DOMAINS, ...extra];
}

export function resourceDomains(env: NodeJS.ProcessEnv = process.env): string[] {
  return [...imageDomains(env), ...tileDomains(env)];
}

export function resourceMeta(env: NodeJS.ProcessEnv = process.env) {
  const domain = env.INKVIEW_UI_DOMAIN;
  return {
    ui: {
      csp: { resourceDomains: resourceDomains(env) },
      prefersBorder: false,
      ...(domain ? { domain } : {}),
    },
  };
}

/** Field schemas shared by component schemas. Server only (uses zod). */
import { z } from "zod";

/**
 * An absolute http or https URL. `z.string().url()` alone also accepts
 * `javascript:` and `data:` URLs, which must never reach a link or an image.
 */
export const httpUrl = z.url({ protocol: /^https?$/, error: "Must be an absolute https:// or http:// URL." });

/** A phone number the view can turn into a `tel:` link. */
export const phone = z
  .string()
  .min(3)
  .max(30)
  .regex(/^[\d\s+\-()]+$/, "phone may contain only digits, spaces, +, -, ( and ).");

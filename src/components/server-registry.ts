/** Server-side registry: schema + markdown fallback per component. */
import type { z } from "zod";
import type { ComponentMeta } from "./types.js";
import * as profileCard from "./profile-card/server.js";

export interface ServerEntry {
  meta: ComponentMeta;
  schema: z.ZodType<Record<string, unknown>>;
  toMarkdown(data: any): string;
}

export const serverComponents: ServerEntry[] = [profileCard];

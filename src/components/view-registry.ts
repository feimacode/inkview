/** View-side registry: React view + structural guard per component. No zod here. */
import type { ViewEntry } from "./types.js";
import { meta as profileCardMeta } from "./profile-card/meta.js";
import { View as ProfileCardView, accepts as profileCardAccepts } from "./profile-card/View.js";

export const viewComponents: ViewEntry[] = [
  { meta: profileCardMeta, View: ProfileCardView, accepts: profileCardAccepts },
];

export const byComponent = new Map(viewComponents.map((c) => [c.meta.component, c]));
export const byTool = new Map(viewComponents.map((c) => [c.meta.tool, c]));

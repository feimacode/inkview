import type { z } from "zod";
import { HARD_MAX_HIGHLIGHTS, MAX_HIGHLIGHTS, ProfileLinkSchema, personSchema, type Person } from "../person.js";

export { ProfileLinkSchema, HARD_MAX_HIGHLIGHTS, MAX_HIGHLIGHTS };

export const profileCardSchema = (maxHighlights = MAX_HIGHLIGHTS) => personSchema(maxHighlights);

export const schema = profileCardSchema();

export type ProfileCard = z.infer<typeof schema>;
export type { Person };

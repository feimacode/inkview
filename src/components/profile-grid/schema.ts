import { z } from "zod";
import { PersonSchema, SourceSchema } from "../person.js";

export const MAX_PEOPLE = 24;

export const schema = z.looseObject({
  title: z.string().max(120).optional().describe('Short heading for the group, e.g. "Conference speakers".'),
  caption: z.string().max(200).optional().describe('One line about the list, e.g. "Showing the 24 most relevant of 61 matches".'),
  people: z
    .array(PersonSchema)
    .min(2, "Send at least 2 people: use show_profile_card for one person.")
    .max(MAX_PEOPLE, `Send at most ${MAX_PEOPLE} people: pick the most relevant and state the total in caption.`)
    .describe("2 to 24 people, most relevant first."),
  source: SourceSchema.optional(),
});

export type ProfileGrid = z.infer<typeof schema>;

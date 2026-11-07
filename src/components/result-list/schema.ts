import { z } from "zod";

const url = z.string().url();

export const ResultSchema = z.looseObject({
  title: z.string().min(1).max(200),
  url: url,
  snippet: z.string().max(500).optional().describe("Short excerpt or summary."),
  source: z.string().max(80).optional().describe('Publisher or site name, e.g. "The Verge".'),
  faviconUrl: url.optional(),
  date: z.string().max(40).optional().describe("Publication date, ISO 8601 preferred."),
  score: z.number().optional().describe("Relevance score, if your tool gave one."),
});

export const MAX_RESULTS = 20;
/** Upper bound for servers that raise the result cap through the SDK. */
export const HARD_MAX_RESULTS = 200;

export function resultListSchema(maxResults = MAX_RESULTS) {
  return z.looseObject({
    title: z.string().max(120).optional(),
    query: z.string().max(200).optional().describe("The search query, shown above the list."),
    results: z.array(ResultSchema).min(1).max(maxResults).describe(`1 to ${maxResults} results, best first.`),
  });
}

export const schema = resultListSchema();

export type Result = z.infer<typeof ResultSchema>;
export type ResultList = z.infer<typeof schema>;

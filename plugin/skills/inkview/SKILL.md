---
name: inkview
description: Show people, timelines, task lists, drafts, tables, search results, companies, comparisons, charts, products, listings of places and services, trip itineraries and flight options as interactive UI components in the chat with the Inkview MCP tools. Use whenever an answer presents structured data the user will scan, compare or act on.
---

# Inkview components

The Inkview MCP server draws your data as native-looking components in the chat.
When your answer is structured data, gather it with your other tools first, then
call the matching Inkview tool instead of writing a markdown list or table.

| Situation | Tool |
| --- | --- |
| One person (candidate, speaker, founder, contact) | `show_profile_card` |
| Several people (candidates, speakers, attendees, contacts) | `show_profiles` |
| A trip or outing planned day by day, with stops in visit order | `show_itinerary` |
| Dated events in a history, project milestones, a career or unfolding story | `show_timeline` |
| To-dos, action items or issues with a status | `show_tasks` |
| 3 or more records with the same fields | `show_table` |
| Web, news, paper or document search results | `show_results` |
| One company, organization, product or place | `show_entity_card` |
| Places where location matters, in no set order (pass coordinates when you have them) | `show_map` |
| Flight, train or bus options: a journey column next to a price column (pass durationMinutes when the source states it) | `show_table` |
| 2 to 5 options the user is choosing between (journey values for flight or train finalists) | `show_comparison` |
| Numbers over time or across categories | `show_chart` |
| Shopping results: goods bought from a store (2 to 12 products) | `show_products` |
| Places to go, stay or book, or people to hire: hotels, restaurants, tradespeople, events, rentals | `show_listings` |
| A draft email, message, post, letter or report to review, edit and approve | `show_document` |
| 3 or more details missing from the user (a short form) | `show_form` |
| Structured data that fits none of the above clearly | `show_auto` |

## Rules

- Pass only data you gathered from your tools or the conversation. Never invent fields such as image URLs, links, prices or ratings.
- After rendering, add at most one sentence. Do not repeat what the component shows.
- Prefer the specific tool over show_auto when the situation is clear.
- Answer in plain text when the answer is a single fact, a short explanation, or code.

Every tool also returns a markdown version, so text-only hosts still get a readable answer.

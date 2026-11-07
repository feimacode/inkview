---
name: inkview
description: Show people, timelines, task lists, drafts, tables, search results, companies, comparisons, charts and products as interactive UI components in the chat with the Inkview MCP tools. Use whenever an answer presents structured data the user will scan, compare or act on.
---

# Inkview components

The Inkview MCP server draws your data as native-looking components in the chat.
When your answer is structured data, gather it with your other tools first, then
call the matching Inkview tool instead of writing a markdown list or table.

| Situation | Tool |
| --- | --- |
| One person (candidate, speaker, founder, contact) | `show_profile_card` |
| Several people (candidates, speakers, attendees, contacts) | `show_profiles` |
| Dated events in a history, project milestones, a career or unfolding story | `show_timeline` |
| To-dos, action items or issues with a status | `show_tasks` |
| 3 or more records with the same fields | `show_table` |
| Web, news, paper or document search results | `show_results` |
| One company, organization, product or place | `show_entity_card` |
| Places with coordinates where location or distance matters | `show_map` |
| 2 to 5 options the user is choosing between | `show_comparison` |
| Numbers over time or across categories | `show_chart` |
| Shopping results (2 to 12 products) | `show_products` |
| A draft email, message, post, letter or report to review, edit and approve | `show_document` |
| 3 or more details missing from the user (a short form) | `show_form` |
| Structured data that fits none of the above clearly | `show_auto` |

## Rules

- Pass only data you gathered from your tools or the conversation. Never invent fields such as image URLs, links, prices or ratings.
- After rendering, add at most one sentence. Do not repeat what the component shows.
- Prefer the specific tool over show_auto when the situation is clear.
- Answer in plain text when the answer is a single fact, a short explanation, or code.

Every tool also returns a markdown version, so text-only hosts still get a readable answer.

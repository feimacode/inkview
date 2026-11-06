/** Guidance text shared by every build: server instructions (and later the Skill). */
import { serverComponents } from "./components/server-registry.js";

export function serverInstructions(): string {
  const lines = serverComponents.map((c) => `- ${c.meta.tool}: ${c.meta.description.split(". ")[0]}.`);
  return [
    "Inkview draws UI components in the chat for data you already have. When your answer fits one of these, call the tool instead of writing the data out as text:",
    ...lines,
    "Pass only data you gathered from your tools or the conversation; never invent fields such as image URLs or links. After rendering, add at most one sentence.",
  ].join("\n");
}

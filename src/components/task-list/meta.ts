import type { ComponentMeta } from "../types.js";

export const meta: ComponentMeta = {
  component: "task_list",
  tool: "show_tasks",
  title: "Show tasks",
  schemaVersion: "1",
  description:
    'Display to-dos, action items or issues as a task list grouped by status, with a checklist or board layout. Use it when the answer is work to track: a project plan, sprint backlog, checklist or set of open issues. Each item needs a title and a status; statuses default to "To do", "In progress" and "Done". The user can check items off and move them between statuses. Send at most 50 items: pick the most relevant and state the total. After calling it, add at most one sentence.',
};

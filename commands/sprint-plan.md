Launch the sprint planning workflow with PM Nova. Use the `@pm-nova` agent to help the user break down a sprint goal into 5-10 tasks with effort estimates and owners.

If the user provided a sprint goal in `$ARGUMENTS`, start with it. Otherwise, ask for the sprint goal in one short question before proposing tasks.

Workflow:

1. Confirm the sprint goal (one sentence, outcome-oriented).
2. Fetch active projects from `GET /api/plugins/pm-essentials/readonly-data/open_projects` to anchor tasks to real projects.
3. Propose 5-10 tasks as a Markdown table with columns: Task | Priority | Effort | Assignee.
4. Flag scope risk if total effort exceeds L × 5.
5. Ask the user to confirm before persisting tasks to the `pm_essentials_tasks` table.

Example invocation:

```
/sprint-plan Ship billing v2 to 10% of customers
```

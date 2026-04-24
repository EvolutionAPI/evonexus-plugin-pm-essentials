---
name: project-health
description: Surface blockers, overdue tasks, and stale items across active projects. Queries the pm_essentials_* tables via the plugin's readonly-data endpoint. Use when the user asks 'how are projects doing?', 'what's blocked?', or wants a health check before a leadership review.
argument-hint: "[optional project name to narrow the scope]"
---

# Project Health

Produce a compact health snapshot of active projects.

## Data sources

- `GET /api/plugins/pm-essentials/readonly-data/open_projects` — active projects with task counts and due dates
- `GET /api/plugins/pm-essentials/readonly-data/sprint_tasks` — tasks in the active sprint

## Output shape

```
### Project health — <YYYY-MM-DD>

**<Project name>** — <N tasks>, due <date>
- ✓ <count_done> done · ⟳ <count_in_progress> in progress · ◯ <count_todo> todo
- 🚩 <blocker_summary or "no blockers">

**<Next project>** …
```

## Instructions

1. Pull `open_projects` and `sprint_tasks`.
2. If `$ARGUMENTS` names a project, filter to that one (case-insensitive contains match).
3. For each project, show task counts by status and flag anything that looks stuck:
   - Tasks in `in_progress` for more than 7 days → "stuck"
   - Tasks past their `due_date` with status ≠ `done` → "overdue"
   - Sprints past their `started_at + 14 days` with tasks still in `todo` → "slipping"
4. Keep the output scannable. No prose. No summary paragraph at the end — the table is the summary.
5. If no blockers, say "no blockers" explicitly per project so the absence is visible.

## Edge cases

- Empty `open_projects` → reply "No active projects. Create one via the chat with pm-nova."
- `sprint_tasks` empty but projects exist → note "no active sprint" under each project.

# PM Essentials Plugin

**id:** `pm-essentials`  
**version:** 0.1.0  
**author:** Evolution Foundation  
**license:** MIT  

## Overview

PM Essentials extends EvoNexus with lightweight project management:

- **PM Nova agent** — sprint planning, health checks, stakeholder updates
- **`/sprint-plan` skill** — interactive sprint breakdown with effort estimates
- **Open Projects widget** — live dashboard card (mounts on Overview)
- **Read-only queries** — `open_projects` and `sprint_tasks` for reporting

## Installation

### From the marketplace

Open `/plugins` in your EvoNexus dashboard, go to **Marketplace**, and
install `pm-essentials`.

### Via CLI

```bash
npx @evoapi/evo-nexus plugin install \
  https://github.com/EvolutionAPI/evonexus-plugin-pm-essentials
```

## Database tables

All tables follow the `pm_essentials_*` prefix convention (ADR-4):

| Table | Purpose |
|-------|---------|
| `pm_essentials_projects` | Projects with status and due date |
| `pm_essentials_sprints` | Time-boxed sprints per project |
| `pm_essentials_tasks` | Tasks linked to projects and optional sprint |

Tables are created automatically on install via `migrations/001_create_tables.sql`.

## Read-only queries

Two named queries are exposed via the plugin readonly-data API:

### `open_projects`

```
GET /api/plugins/pm-essentials/readonly-data/open_projects
```

Returns all active projects with task counts:

```json
{
  "query": "open_projects",
  "count": 3,
  "rows": [
    { "id": "...", "name": "Evo AI v2", "status": "active", "due_date": "2026-06-30", "task_count": 12 }
  ]
}
```

### `sprint_tasks`

```
GET /api/plugins/pm-essentials/readonly-data/sprint_tasks
```

Returns all tasks in the currently active sprint.

## Widget

The `pm-open-projects` Web Component renders on the Overview page as a card
listing active projects with task counts and due dates. It is loaded lazily via
dynamic import — no page reload required.

## Heartbeat

`pm-essentials-daily-standup` wakes every 24h and checks for overdue tasks or
sprints ending soon. Disabled by default — enable in `/scheduler`.

## Claude hook

`on_stop.py` fires on every `Stop` event and logs session metadata for
observability. Non-blocking: failures are silently swallowed.

## Uninstalling

```bash
npx @evoapi/evo-nexus plugin uninstall pm-essentials
```

Database tables are NOT dropped on uninstall to preserve data. Drop manually
if needed:

```sql
DROP TABLE IF EXISTS pm_essentials_tasks;
DROP TABLE IF EXISTS pm_essentials_sprints;
DROP TABLE IF EXISTS pm_essentials_projects;
```

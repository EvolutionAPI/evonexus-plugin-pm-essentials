# PM Essentials — Workspace Rules

These rules are injected into every agent session when PM Essentials is installed.

## Project management conventions

- Use ISO 8601 dates (`YYYY-MM-DD`) for all due dates.
- Priority levels: `urgent` > `high` > `medium` > `low`.
- Sprint duration: 2 weeks (default). Adjust only with explicit team agreement.
- Tasks must belong to a project before they can join a sprint.
- Definition of Done: a task is `done` only when it has been reviewed and merged/deployed.

## Status vocabulary

| Status | Meaning |
|--------|---------|
| `todo` | Not started |
| `in_progress` | Actively being worked on |
| `review` | Awaiting code review or QA |
| `done` | Completed and verified |
| `cancelled` | Dropped — document the reason in a comment |

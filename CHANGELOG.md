# Changelog

All notable changes to PM Essentials are documented here.

## [0.1.0] — 2026-04-23

### Added

- Initial release
- PM Nova agent with sprint planning, health check, and status update capabilities
- `/sprint-plan` skill with interactive task breakdown
- `pm-open-projects` Web Component widget for the Overview dashboard
- `open_projects` and `sprint_tasks` read-only SQL queries
- `on_stop` Claude hook handler for session observability
- `pm-essentials-daily-standup` heartbeat (disabled by default)
- Weekly status routine (`routines/weekly-status.py`)
- SQLite schema: `pm_essentials_projects`, `pm_essentials_sprints`, `pm_essentials_tasks`

# Changelog

All notable changes to PM Essentials are documented here.

## [0.1.3] — 2026-04-24

### Fixed

- Added `routines/routines.yaml` declaring the `pm-essentials-weekly-status` cron. Without this file, the scheduler never picked up `weekly-status.py` (it's not enough to ship the .py — EvoNexus loads routines from the declarative YAML).

## [0.1.2] — 2026-04-24

### Fixed

- Widget `custom_element_name` now matches the `customElements.define()` call inside the bundle (`pm-open-projects`). Earlier version declared `pm-open-projects-widget` in the manifest which caused the host to append an element that was never registered, leaving the card empty.

## [0.1.1] — 2026-04-23

### Fixed

- Agent `pm-nova.md` now ships with YAML frontmatter (`name`, `description`, `model`) so EvoNexus loads it as a distinct persona instead of the default Claude Code prompt
- Skill `sprint-plan` restructured as a directory (`skills/sprint-plan/SKILL.md`) to match the Claude Code skill layout contract
- Widget `pm-open-projects` declares `mount_point: overview`, `custom_element_name`, and `filename` so the dashboard widget loader can discover and mount it
- SQL migration renamed from `001_create_tables.sql` to `install.sql` to match the EvoNexus installer contract (the installer runs `migrations/install.sql` only)

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

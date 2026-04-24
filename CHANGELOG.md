# Changelog

All notable changes to PM Essentials are documented here.

## [0.1.7] — 2026-04-24

Three new capabilities from the v1a extension pass — **goals**, **tasks**,
**triggers** — demonstrated end-to-end. On install the plugin now seeds
2 projects, 2 goals, 2 tickets, and 2 triggers into the host tables,
all tagged with `source_plugin: pm-essentials`. Uninstall deletes them
with a single `DELETE WHERE source_plugin = ?`, leaving user-created
rows untouched.

### Added

- **`goals/goals.yaml`** — declares `Billing v2` and `Onboarding Redesign`
  projects plus two measurable goals tied to them.
- **`tasks/tasks.yaml`** — two seed tickets assigned to `pm-nova`, linked
  to the goals above. The plugin's agent auto-prefix kicks in so the
  assignee resolves to `plugin-pm-essentials-pm-nova`.
- **`triggers/triggers.yaml`** — two event triggers: a Friday cron that
  fires the stakeholder-update skill, and a ticket.created handler that
  pings PM Nova on urgent tickets. Both ship disabled — the user reviews
  and enables before they fire.
- **`capabilities:` list** declares `goals`, `tasks`, `triggers` so the
  install preview warns about the host rows the plugin will create.

## [0.1.6] — 2026-04-24

Plugin promoted to **reference implementation** of the EvoNexus v1a plugin
contract. Exercises every supported capability so community plugin authors
can copy this repo as their starting template.

### Added

- **Two new skills**: `project-health` (surface blockers/overdue/stale tasks
  across active projects) and `stakeholder-update` (≤ 150-word status block
  adapted by audience — leadership/team/investors).
- **Second slash command**: `/pm-status` chains `project-health` +
  `stakeholder-update` in one pass.
- **Second dashboard widget**: `pm-sprint-burndown` — stacked bar of task
  counts per status in the active sprint, mounted on `/overview`.
- **Third readonly query**: `sprint_burndown` — counts by status for the
  active sprint, feeds the new widget.
- **`migrations/uninstall.sql`**: explicit DROP of all three tables. Without
  it, the host would leave SQL state behind on delete.
- **Seed data in `install.sql`**: 3 projects, 1 active sprint, 8 tasks. The
  first install now has something for the widgets to render and the agent
  to reason about, instead of staring at an empty dashboard.
- **Rewrote `README.md`** as the reference guide: capability table, repo
  layout, install map, required conventions, step-by-step for forking this
  repo into your own plugin.

### Changed

- **`agents/pm-nova.md`** body extended to reference the three skills by
  name and wire the data sources explicitly. Persona is now stronger and
  more likely to override the claude_code preset.
- **`plugin.yaml`** manifest reorganised with inline comments explaining
  each field, intended as documentation for plugin authors.

## [0.1.5] — 2026-04-24

### Fixed

- **Conformance with native Claude Code / EvoNexus conventions** after auditing all 39 native agents, 200 native skills, and 41 native commands:
  - Agent `description` now embeds `Examples:` with `<uses Agent tool to launch pm-nova>` lines, matching the native discovery format. Without examples the agent router had nothing to pattern-match against.
  - Skill frontmatter dropped the invented `trigger:` and `context:` fields — no native skill uses them. Added `argument-hint:` which 56 native skills use for argument discovery. Skills are invoked by name, not by a declarative trigger string.
  - Command file is now pure markdown without YAML frontmatter. 40/41 native commands ship without frontmatter; the `skill:` field in particular does not exist in the Claude Code command contract.

## [0.1.4] — 2026-04-24

### Changed

- Expanded `agents/pm-nova.md` body with explicit identity reinforcement, scope, tone rules, and example openings. The previous 1.3 KB prompt was too thin to override the Claude Code preset the host injects, so chats were defaulting to the generic "I'm Claude Code" persona. Native EvoNexus agents (Nova, Oracle) ship 20 KB+ prompts — this plugin now matches that standard.

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

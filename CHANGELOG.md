# Changelog

All notable changes to PM Essentials are documented here.

## [0.4.0] — 2026-04-24

Plugin v1 Final — MCP servers (Wave 2.3) + Integrations with env vars (Wave 2.2r)
+ Security scan compliance (Wave 2.5).

### Added

- **Wave 2.3 — MCP server declaration**:
  - `filesystem-pm` — injects `@modelcontextprotocol/server-filesystem` into
    `~/.claude.json` under key `plugin-pm-essentials-filesystem-pm`, pointing to
    `${WORKSPACE}/workspace/project`. Requires `npx` in PATH.
  - After install/update, a banner prompts you to restart Claude Code CLI to
    activate the MCP server.

- **Wave 2.2r — Integration: Todoist**:
  - Declares `TODOIST_PLUGIN_API_KEY` env var under `integrations[].env_vars`.
  - Appears in `/integrations` → Custom tab as "PM Essentials — Todoist" card
    with a "via plugin" badge and schema-driven Configure modal (password input,
    masked display, audit logs keys only).
  - On uninstall, `# plugin-pm-essentials` section is automatically removed
    from `.env` (no leaked credentials).
  - **Note:** `health_check` is intentionally omitted in v0.4.0. The Todoist
    REST API requires a Bearer Authorization header, which is not yet supported
    by the v1 `HealthCheckSpec` schema (headers support is a v2 follow-up).
    Use the manual Test button (available once headers land) to verify
    connectivity.

- **Wave 2.5 — Security scan compliance**:
  - All agent/skill markdown reviewed; no prompt injection, dangerous SQL, or
    shell exec patterns. Scan verdict: `APPROVE`.

### Changed

- `description` expanded to document Wave 2.2r + 2.3 capabilities.
- `min_evonexus_version` unchanged at `0.30.0` (compatible with current
  EvoNexus — core will pick up new capabilities on next release).

## [0.3.1] — 2026-04-24

### Fixed

- **Projects page due-date timezone shift** — `_formatDate()` and `_isOverdue()`
  now parse `YYYY-MM-DD` as a local date instead of handing the raw string to
  `new Date()`, which interpreted it as UTC midnight and rendered the previous
  day on negative-offset timezones (e.g. BRT showed `Jan 1` as `Dec 31`).

## [0.3.0] — 2026-04-24

First release to use **Wave 2.1 Custom pages** — PM Essentials now ships four
full-screen plugin pages that exercise the complete plugin UI surface in
EvoNexus.

### Added

- **Full-screen pages** at `/plugins-ui/pm-essentials/<page>`:
  - `ui/pages/company.js` — Company configuration form.
  - `ui/pages/projects.js` — Full CRUD for `pm_essentials_projects`.
  - `ui/pages/kanban.js` — HTML5-native drag-and-drop sprint kanban.
  - `ui/pages/reports.js` — Velocity bar chart + status breakdown via Canvas 2D.
- **Sidebar group** "PM Essentials" (collapsible, order 10).
- **New capabilities**:
  - `ui_pages` — declares pages via `ui_entry_points.pages[]` and `sidebar_groups[]`.
  - `writable_data` — CRUD endpoints with column allowlist and optional JSON Schema
    validation (`pm_essentials_projects`, `pm_essentials_tasks`).
- **New SQL tables**: `pm_essentials_company_config`, `pm_essentials_projects`,
  `pm_essentials_sprints`, `pm_essentials_tasks`.

### Requires

EvoNexus core with Wave 2.1 schema support. Installs cleanly on older cores —
`ui_pages` and `writable_data` are optional; pages simply won't appear until
the core is updated.

## [0.2.0] — 2026-04-24

First release to use **Wave 2.0 Plugin & Agent identity** — EvoNexus now
renders plugin icon in the plugin card/detail, and PM Nova shows her own
avatar in the agent chat and listing.

### Added

- **`ui/assets/icon.png`** — 128×128 PNG plugin icon (kanban-style flat
  design, Evolution green `#00FFA7` on dark `#0d1117`). Served by the
  existing `/plugins/pm-essentials/ui/<path>` endpoint.
- **`ui/assets/avatars/pm-nova.png`** — 256×256 PNG avatar for PM Nova
  agent. Injected into the frontend agent registry via `GET /api/agent-meta`
  and rendered in chat bubbles and the `/agents` page.
- **`metadata.icon`** and **`agents[].avatar`** fields in `plugin.yaml`,
  both with `*_sha256` for tamper detection (verified by `plugin-health`).

### Notes

- Requires EvoNexus core with Wave 2.0 schema support (branch
  `feature/plugins-v1`, merge pending). Installs cleanly on older cores
  — `metadata` and `agents` are optional fields; the icon simply won't
  appear until the core is updated.
- Browser cache for assets is `max-age=3600 immutable`. After update from
  v0.1.x the new icon appears within 1 hour, or immediately on hard refresh.


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

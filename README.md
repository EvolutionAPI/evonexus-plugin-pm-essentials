# PM Essentials — EvoNexus Reference Plugin

> **This plugin is the reference implementation of the EvoNexus v1a plugin contract.**
> Copy this repo as the starting template when building your own plugin — it exercises
> every capability the host supports, so you can delete what you don't need and be
> confident the rest is shaped correctly.

## What you get after install

| Capability            | What ships                                                                 |
| --------------------- | -------------------------------------------------------------------------- |
| **Agent**             | `pm-nova` — product-management persona reachable from `/agents/pm-nova`    |
| **Skills (3)**        | `sprint-plan`, `project-health`, `stakeholder-update`                      |
| **Commands (2)**      | `/sprint-plan`, `/pm-status`                                               |
| **Rule**              | `pm-conventions` — injected into every agent session                       |
| **SQL schema**        | `pm_essentials_projects`, `_sprints`, `_tasks` + seed data (3 projects, 8 tasks, 1 active sprint) |
| **Widgets (2)**       | **Open Projects** and **Sprint Burndown**, both on `/overview`             |
| **Read-only queries** | `open_projects`, `sprint_tasks`, `sprint_burndown`                         |
| **Heartbeat**         | `pm-essentials-daily-standup` — disabled by default                        |
| **Routine**           | `pm-essentials-weekly-status` — Fri 09:00, disabled by default             |
| **Claude Code hook**  | `Stop`-event handler                                                       |
| **Seed goals**        | 2 projects (`Billing v2`, `Onboarding Redesign`) + 2 goals with targets    |
| **Seed tasks**        | 2 tickets assigned to `pm-nova`, linked to the goals                       |
| **Seed triggers**     | 2 event triggers (cron + ticket.created) shipped disabled — user enables   |

## Install

```
Dashboard → Plugins → Install Plugin → URL:
  github:EvolutionAPI/evonexus-plugin-pm-essentials
```

Or pinned to a tag:

```
github:EvolutionAPI/evonexus-plugin-pm-essentials@v0.1.6
```

## Repo layout

```
evonexus-plugin-pm-essentials/
├── plugin.yaml                           # manifest — single source of truth
├── CHANGELOG.md
├── README.md                             # this file
├── agents/
│   └── pm-nova.md                        # YAML frontmatter + persona body
├── skills/                               # skills are DIRECTORIES
│   ├── sprint-plan/SKILL.md
│   ├── project-health/SKILL.md
│   └── stakeholder-update/SKILL.md
├── commands/                             # commands are flat markdown, no frontmatter
│   ├── sprint-plan.md
│   └── pm-status.md
├── rules/
│   └── pm-conventions.md                 # raw markdown, injected via _plugins-index.md
├── migrations/
│   ├── install.sql                       # DDL + seed data (runs in transaction)
│   └── uninstall.sql                     # DROP the same tables
├── claude-hook-handlers/
│   └── on_stop.py                        # fires on Claude Code Stop event
├── heartbeats.yaml                       # declarative heartbeat
├── routines/
│   ├── routines.yaml                     # cron declaration (required)
│   └── weekly-status.py                  # routine body
├── ui/
│   └── widgets/
│       ├── pm-open-projects.js           # vanilla JS custom element
│       └── pm-sprint-burndown.js
├── goals/
│   └── goals.yaml                        # seed projects + goals (DELETE WHERE source_plugin on uninstall)
├── tasks/
│   └── tasks.yaml                        # seed tickets, auto-assigned to plugin agent
├── triggers/
│   └── triggers.yaml                     # seed triggers, disabled by default
└── docs/pm-essentials.md                 # end-user docs
```

## How the host maps each file on install

When the installer runs, it copies files into namespaced locations with the
prefix `plugin-{slug}-` so multiple plugins don't clobber each other:

| File in the plugin        | Ends up at                                                     | Why                                                 |
| ------------------------- | -------------------------------------------------------------- | --------------------------------------------------- |
| `agents/*.md`             | `.claude/agents/plugin-pm-essentials-*.md`                     | Claude Code's agent loader reads from there         |
| `skills/*/SKILL.md`       | `.claude/skills/plugin-pm-essentials-*/SKILL.md`               | Skills invoked by directory name                    |
| `commands/*.md`           | `.claude/commands/plugin-pm-essentials-*.md`                   | Slash commands discovered from filename             |
| `rules/*.md`              | `.claude/rules/plugin-pm-essentials-*.md` + index marker       | Injected into agent sessions                        |
| `migrations/install.sql`  | Runs once against `dashboard/data/evonexus.db` in a transaction | Rollback on error                                   |
| `migrations/uninstall.sql`| Runs on delete                                                 | Must DROP every table install.sql created           |
| `ui/widgets/*.js`         | Served under `/plugins/pm-essentials/ui/widgets/*.js`          | Host loads via dynamic `import()`                   |
| `heartbeats.yaml`         | Merged into runtime heartbeat registry                         | `agent:` names auto-prefixed with `plugin-{slug}-`  |
| `routines/routines.yaml`  | Merged into scheduler                                          | Cron jobs register at next SIGHUP                   |
| `claude-hook-handlers/*`  | Invoked by EvoNexus dispatcher                                 | Dispatcher exits 0 even on handler crash            |

The installer also writes `.install-manifest.json` inside `plugins/pm-essentials/`
with SHA256 of every copied file, so the health check can detect tampering.

## Required conventions — non-negotiable

Breaking any of these makes the plugin silently half-installed. The installer
enforces most; Claude Code itself enforces the rest.

1. **Slug namespace for SQL tables.** Every table must start with the plugin
   id as a prefix (`pm_essentials_*`). The `readonly_data` validator rejects
   queries that touch any other tables.

2. **`name:` in frontmatter equals the filename stem.** The host rewrites
   `name:` on copy, but if your source's `name:` is wrong it won't match the
   final prefixed filename/dirname and the loader skips it.

3. **Widget `custom_element_name` must match the bundle's `customElements.define(...)`.**
   If the bundle registers `<pm-open-projects>` but the manifest declares
   `pm-open-projects-widget`, the host appends a tag nothing defined and the
   card stays empty.

4. **Widget `mount_point` is required.** Only declared mount points render.
   Today the only supported one is `overview` — more land in v1b.

5. **Commands are plain markdown.** 40/41 native commands ship without
   frontmatter. Don't invent fields like `skill:`.

6. **`routines/routines.yaml` is required if you ship routines.** The
   scheduler loads from the declarative YAML, not from scanning `.py` files.

7. **Heartbeats' `agent:` is the bare name.** The host auto-prefixes with
   `plugin-{slug}-` on load. Don't pre-prefix.

8. **`plugin.yaml version` is the source of truth.** The host only upgrades
   when the candidate version is strictly greater than installed.

## Creating your own plugin

```bash
# 1. Clone this repo as a starting point
git clone https://github.com/EvolutionAPI/evonexus-plugin-pm-essentials my-plugin
cd my-plugin && rm -rf .git && git init -b main

# 2. Rename the slug everywhere
#    - plugin.yaml: id, name, description, source_url, homepage
#    - migrations/*.sql: table prefixes
#    - skills/*/SKILL.md: readonly endpoint paths
#    - ui/widgets/*.js: endpoint URLs + customElements.define() tag

# 3. Delete capabilities you don't need
#    (e.g. remove heartbeats from capabilities: list, delete heartbeats.yaml)

# 4. Push to a public GitHub repo (MIT recommended for the marketplace)

# 5. Install into EvoNexus
#    Dashboard → Plugins → Install → github:your-org/my-plugin
```

## Versioning

Follow [Semantic Versioning](https://semver.org/). The host allows updates
only when the candidate version is strictly greater than installed. If you
change `install.sql` between versions the update is blocked — v1a has no
migration chain, so users uninstall+reinstall when the schema changes. Full
migration chains land in v1b.

## License

MIT — see [LICENSE](LICENSE).

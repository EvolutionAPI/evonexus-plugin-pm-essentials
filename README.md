# EvoNexus Plugin: PM Essentials

Reference implementation of an EvoNexus v1a plugin, showcasing all 9 capability types.

## Install

```bash
npx @evoapi/evo-nexus plugin install \
  https://github.com/EvolutionAPI/evonexus-plugin-pm-essentials
```

Or from the EvoNexus dashboard: `/plugins` → Marketplace → PM Essentials.

## Capabilities

| Capability | File(s) |
|-----------|---------|
| `agents` | `agents/pm-nova.md` |
| `skills` | `skills/sprint-plan.md` |
| `rules` | `rules/pm-conventions.md` |
| `heartbeats` | `heartbeats.yaml` |
| `sql_migrations` | `migrations/001_create_tables.sql` |
| `widgets` | `ui/widgets/pm-open-projects.js` |
| `claude_hooks` | `claude-hook-handlers/on_stop.py` |
| `readonly_data` | Declared in `plugin.yaml` |

## Documentation

See [docs/pm-essentials.md](docs/pm-essentials.md) for full usage guide.

## License

MIT — see [LICENSE](LICENSE).

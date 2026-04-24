Run a quick project health + stakeholder-update pass with PM Nova. Use the `@pm-nova` agent to produce both a scannable health table and a ≤ 150-word status update in sequence.

If `$ARGUMENTS` provides an audience hint (e.g. "leadership", "team"), forward it to the `stakeholder-update` skill.

Workflow:

1. Invoke `project-health` skill — output the compact table showing blockers, overdue, stuck items per active project.
2. Invoke `stakeholder-update` skill with the audience from `$ARGUMENTS` (or "team" default) — output the 4-section status block.
3. End with one line: "Quer que eu transforme algum blocker em ticket? Posso abrir via `/create-ticket`."

Example:

```
/pm-status leadership
```

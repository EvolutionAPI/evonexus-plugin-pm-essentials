---
name: stakeholder-update
description: Generate a ≤ 150-word stakeholder status update from plugin data — Accomplishments | In Progress | Blockers | Next Steps. Use when the user asks for a weekly status, leadership update, or sprint recap.
argument-hint: "[audience — e.g. 'leadership', 'investors', 'team']"
---

# Stakeholder Update

Generate a tight ≤ 150-word status update using the plugin's real data.

## Data sources

- `GET /api/plugins/pm-essentials/readonly-data/open_projects`
- `GET /api/plugins/pm-essentials/readonly-data/sprint_tasks`
- `GET /api/plugins/pm-essentials/readonly-data/sprint_burndown`

## Output shape

```
**Status update — <YYYY-MM-DD>**
_Audience: <argument or "team">_

**Accomplishments**
- <bullet>
- <bullet>

**In Progress**
- <bullet>

**Blockers**
- <bullet or "None">

**Next Steps**
- <bullet>
```

## Instructions

1. Accomplishments = tasks with status `done` in the last 7 days. Bullet each one by title.
2. In Progress = tasks currently `in_progress` or `review`. Group by project.
3. Blockers = overdue tasks OR tasks with priority `urgent` stuck > 3 days. Be explicit: "Stripe price IDs wiring blocked on credentials rotation" beats "some tasks stuck".
4. Next Steps = tasks in `todo` ordered by priority DESC — pick the top 3.
5. HARD LIMIT: 150 words. If you're over, cut the weakest bullet in Accomplishments and In Progress (Blockers and Next Steps take priority).
6. Adapt tone by audience:
   - `leadership` / `investors` → outcome-framed ("shipped checkout to 10%"), avoid task IDs
   - `team` → keep the task granularity, include owner names
   - default (no `$ARGUMENTS`) → neutral

## Example

```
**Status update — 2026-04-24**
_Audience: leadership_

**Accomplishments**
- Stripe price IDs wired and verified in staging.

**In Progress**
- Checkout redesign — 60% complete; target merge 2026-04-26.
- Server-side idempotency keys — in review, holding for perf test.

**Blockers**
- None.

**Next Steps**
- Start feature flag for 10% rollout (blocked only on checkout merge).
```
